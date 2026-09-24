from django.db.models import Count
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from events.models import Event
from tickets.models import Ticket, ValidationLog
from accounts.models import User
from accounts.permissions import IsAgent, IsAdmin


class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, *args, **kwargs):
        total_users = User.objects.count()
        users_by_role = (
            User.objects.values("role")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        total_events = Event.objects.count()
        active_events = Event.objects.filter(end_date__gte=timezone.now()).count()

        total_tickets = Ticket.objects.count()
        tickets_used = Ticket.objects.filter(status="USED").count()
        tickets_valid = Ticket.objects.filter(status="VALID").count()

        total_validations = ValidationLog.objects.count()
        successful_validations = ValidationLog.objects.filter(result="SUCCESS").count()
        failed_validations = total_validations - successful_validations

        today = timezone.now().date()
        today_validations = ValidationLog.objects.filter(
            validated_at__date=today
        ).count()

        top_events = (
            Event.objects.annotate(ticket_count=Count("tickets"))
            .values("title", "ticket_count")
            .order_by("-ticket_count")[:5]
        )

        recent_validations = (
            ValidationLog.objects.select_related("ticket", "validated_by")
            .values(
                "id",
                "result",
                "reason",
                "validation_mode",
                "validated_at",
                "ticket_id",
                "validated_by__email",
            )
            .order_by("-validated_at")[:10]
        )

        events_per_organizer = (
            Event.objects.values("created_by__username", "created_by__email")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )

        return Response({
            "total_users": total_users,
            "users_by_role": [
                {"role": item["role"], "count": item["count"]}
                for item in users_by_role
            ],
            "total_events": total_events,
            "active_events": active_events,
            "total_tickets": total_tickets,
            "tickets_used": tickets_used,
            "tickets_valid": tickets_valid,
            "total_validations": total_validations,
            "successful_validations": successful_validations,
            "failed_validations": failed_validations,
            "today_validations": today_validations,
            "top_events": list(top_events),
            "recent_validations": list(recent_validations),
            "events_per_organizer": [
                {
                    "username": item["created_by__username"],
                    "email": item["created_by__email"],
                    "event_count": item["count"],
                }
                for item in events_per_organizer
            ],
        })


class AgentDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAgent]

    def get(self, request, *args, **kwargs):
        user = request.user
        today = timezone.now().date()

        today_logs = ValidationLog.objects.filter(validated_by=user, validated_at__date=today)
        today_validations = today_logs.count()
        today_success = today_logs.filter(result="SUCCESS").count()
        today_failure = today_validations - today_success

        all_logs = ValidationLog.objects.filter(validated_by=user)
        total_validations = all_logs.count()
        total_success = all_logs.filter(result="SUCCESS").count()
        total_failure = total_validations - total_success

        by_mode = (
            all_logs.values("validation_mode")
            .annotate(count=Count("id"))
        )

        recent_logs = (
            all_logs.select_related("ticket", "ticket__event")
            .values(
                "id",
                "result",
                "reason",
                "validation_mode",
                "validated_at",
                "ticket_id",
            )
            .order_by("-validated_at")[:10]
        )

        return Response({
            "today_validations": today_validations,
            "today_success": today_success,
            "today_failure": today_failure,
            "total_validations": total_validations,
            "total_success": total_success,
            "total_failure": total_failure,
            "by_mode": [
                {"mode": item["validation_mode"], "count": item["count"]}
                for item in by_mode
            ],
            "recent_validations": list(recent_logs),
        })
