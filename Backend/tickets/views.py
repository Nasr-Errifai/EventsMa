import json
import logging
from django.utils import timezone
from django.http import FileResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Ticket, ValidationLog
from .serializers import TicketSerializer, TicketQRSerializer
from events.models import Event
from .qr_service import verify_qr
from .download_service import get_qr_image, generate_pdf_ticket
from accounts.permissions import IsAgent


class TicketListView(generics.ListAPIView):
    serializer_class = TicketSerializer

    def get_queryset(self):
        return Ticket.objects.select_related("event", "user").filter(
            user=self.request.user
        )

    def get_permissions(self):
        return [permissions.IsAuthenticated()]


class TicketDetailView(generics.RetrieveAPIView):
    serializer_class = TicketSerializer
    lookup_field = "id"

    def get_queryset(self):
        return Ticket.objects.select_related("event", "user").filter(
            user=self.request.user
        )

    def get_permissions(self):
        return [permissions.IsAuthenticated()]


class TicketQRView(generics.RetrieveAPIView):
    serializer_class = TicketQRSerializer
    lookup_field = "id"

    def get_queryset(self):
        return Ticket.objects.select_related("event", "user").filter(
            user=self.request.user
        )

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        ticket = self.get_object()
        if not ticket.qr_payload or not ticket.qr_signature:
            ticket.generate_qr()
        from .download_service import get_qr_image_base64
        serializer = self.get_serializer(ticket)
        serializer.data["qr_image"] = get_qr_image_base64(ticket)
        return Response(serializer.data)


class TicketValidateView(generics.GenericAPIView):
    permission_classes = [IsAgent]

    def post(self, request, *args, **kwargs):
        raw_payload = request.data.get("qr_payload", "")
        raw_signature = request.data.get("qr_signature", "")

        if not raw_payload or not raw_signature:
            return self._log_and_return(
                None, request.user, "FAILURE", "Missing payload or signature"
            )

        try:
            payload = json.loads(raw_payload)
        except (json.JSONDecodeError, TypeError):
            return self._log_and_return(
                None, request.user, "FAILURE", "Invalid JSON payload"
            )

        ticket_id = payload.get("ticket_id")
        event_id = payload.get("event_id")

        if not ticket_id or not event_id:
            return self._log_and_return(
                None, request.user, "FAILURE", "Missing ticket_id or event_id in payload"
            )

        if not verify_qr(payload, raw_signature):
            return self._log_and_return(
                None, request.user, "FAILURE", "Signature verification failed"
            )

        try:
            ticket = Ticket.objects.select_related("event").get(id=ticket_id)
        except Ticket.DoesNotExist:
            return self._log_and_return(
                None, request.user, "FAILURE", "Ticket not found"
            )

        if str(ticket.event.id) != event_id:
            return self._log_and_return(
                ticket, request.user, "FAILURE", "Event mismatch"
            )

        if ticket.status == "USED":
            return self._log_and_return(
                ticket, request.user, "FAILURE", "Ticket already used"
            )

        if ticket.status == "CANCELED":
            return self._log_and_return(
                ticket, request.user, "FAILURE", "Ticket canceled"
            )

        if ticket.status != "VALID":
            return self._log_and_return(
                ticket, request.user, "FAILURE", f"Invalid ticket status: {ticket.status}"
            )

        ticket.status = "USED"
        ticket.save(update_fields=["status"])

        return self._log_and_return(
            ticket, request.user, "SUCCESS", "Ticket validated"
        )

    def _log_and_return(self, ticket, user, result, reason):
        ValidationLog.objects.create(
            ticket=ticket,
            validated_by=user,
            result=result,
            reason=reason,
        )
        data = {"valid": result == "SUCCESS", "message": reason}
        if ticket:
            data["event_title"] = ticket.event.title
            data["ticket_id"] = str(ticket.id)
        status_code = status.HTTP_200_OK if result == "SUCCESS" else status.HTTP_400_BAD_REQUEST
        return Response(data, status=status_code)


class TicketQRImageView(generics.RetrieveAPIView):
    lookup_field = "id"

    def get_queryset(self):
        return Ticket.objects.select_related("event", "user").filter(
            user=self.request.user
        )

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        ticket = self.get_object()
        qr_buffer = get_qr_image(ticket)
        return FileResponse(
            qr_buffer,
            content_type="image/png",
            as_attachment=True,
            filename=f"ticket-{ticket.id}.png",
        )


class TicketPDFView(generics.RetrieveAPIView):
    lookup_field = "id"

    def get_queryset(self):
        return Ticket.objects.select_related("event", "user").filter(
            user=self.request.user
        )

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        ticket = self.get_object()
        pdf_buffer = generate_pdf_ticket(ticket)
        return FileResponse(
            pdf_buffer,
            content_type="application/pdf",
            as_attachment=True,
            filename=f"ticket-{ticket.id}.pdf",
        )


class EventOfflineDataView(APIView):
    permission_classes = [IsAgent]

    def get(self, request, id):
        try:
            event = Event.objects.get(id=id)
        except Event.DoesNotExist:
            raise NotFound("Event not found")

        tickets = Ticket.objects.filter(event=event, status="VALID").values(
            "id", "qr_signature", "qr_payload", "user__email"
        )

        return Response({
            "event_id": str(event.id),
            "event_title": event.title,
            "synced_at": timezone.now().isoformat(),
            "total_valid_tickets": len(tickets),
            "tickets": [
                {
                    "ticket_id": str(t["id"]),
                    "qr_signature": t["qr_signature"],
                    "qr_payload": t["qr_payload"],
                    "user_email": t["user__email"],
                }
                for t in tickets
            ],
        })


class TicketSyncView(APIView):
    permission_classes = [IsAgent]

    def post(self, request, *args, **kwargs):
        scans = request.data.get("scans", [])
        device_id = request.data.get("device_id", "unknown")

        synced = []
        conflicts = []

        for scan in scans:
            ticket_id = scan.get("ticket_id")
            scanned_at = scan.get("scanned_at")

            try:
                ticket = Ticket.objects.get(id=ticket_id)
            except Ticket.DoesNotExist:
                conflicts.append({
                    "ticket_id": ticket_id,
                    "reason": "Ticket not found in database",
                })
                continue

            if ticket.status == "USED":
                conflicts.append({
                    "ticket_id": ticket_id,
                    "reason": "Ticket already marked as USED",
                })
                ValidationLog.objects.create(
                    ticket=ticket,
                    ticket_id_raw=ticket_id,
                    validated_by=request.user,
                    result="FAILURE",
                    reason="Duplicate: already USED",
                    validation_mode="OFFLINE",
                    sync_status="CONFLICT",
                )
                continue

            if ticket.status != "VALID":
                conflicts.append({
                    "ticket_id": ticket_id,
                    "reason": f"Invalid status: {ticket.status}",
                })
                continue

            ticket.status = "USED"
            ticket.save(update_fields=["status"])
            synced.append(ticket_id)

            log = ValidationLog.objects.filter(
                ticket=ticket,
                validation_mode="OFFLINE",
                sync_status="PENDING",
            ).order_by("-validated_at").first()

            if log:
                log.sync_status = "SYNCED"
                log.save(update_fields=["sync_status"])

        return Response({
            "device_id": device_id,
            "synced_count": len(synced),
            "synced_ids": synced,
            "conflicts": conflicts,
        })
