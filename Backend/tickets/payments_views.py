import stripe
from django.conf import settings
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from events.models import Event
from tickets.models import Ticket

MAX_TICKETS_PER_EVENT = 5


class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        event_id = request.data.get("event_id")
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({"detail": "Event not found"}, status=status.HTTP_404_NOT_FOUND)

        if event.status != "APPROVED":
            return Response({"detail": "Event is not approved"}, status=status.HTTP_403_FORBIDDEN)

        existing_count = Ticket.objects.filter(event=event, user=request.user).count()
        if existing_count >= MAX_TICKETS_PER_EVENT:
            return Response(
                {"detail": f"You can purchase a maximum of {MAX_TICKETS_PER_EVENT} tickets for this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.price == 0:
            ticket = Ticket.objects.create(event=event, user=request.user)
            ticket.generate_qr()
            return Response({"detail": "Free ticket created", "ticket_id": ticket.id, "free": True})

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'mad',
                        'unit_amount': int(event.price * 100),
                        'product_data': {'name': event.title},
                    },
                    'quantity': 1,
                }],
                mode='payment',
                metadata={
                    'event_id': str(event.id),
                    'user_id': str(request.user.id),
                },
                success_url=settings.FRONTEND_URL + '/my-tickets?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=settings.FRONTEND_URL + f'/events/{event.id}',
            )
            return Response({'checkout_url': checkout_session.url})
        except stripe.error.StripeError as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            session_id = session.get('id', '')
            event_id = session.get('metadata', {}).get('event_id')
            user_id = session.get('metadata', {}).get('user_id')

            if event_id and user_id and session_id:
                try:
                    from accounts.models import User
                    event_obj = Event.objects.get(id=event_id)
                    user_obj = User.objects.get(id=user_id)

                    ticket = Ticket.objects.filter(stripe_session_id=session_id).first()
                    if not ticket:
                        ticket = Ticket.objects.create(
                            event=event_obj,
                            user=user_obj,
                            stripe_session_id=session_id,
                        )
                        ticket.generate_qr()
                except Exception as e:
                    print(f"Error creating ticket from webhook: {e}")

        return HttpResponse(status=200)


class VerifyPaymentSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"detail": "session_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        ticket = Ticket.objects.filter(stripe_session_id=session_id).first()
        if ticket:
            return Response({"paid": True, "detail": "Ticket already created", "ticket_id": str(ticket.id)})

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if session.payment_status != "paid":
            return Response({"paid": False, "detail": "Payment not completed"}, status=status.HTTP_400_BAD_REQUEST)

        event_id = session.get('metadata', {}).get('event_id')
        user_id = session.get('metadata', {}).get('user_id')

        if str(request.user.id) != user_id:
            return Response({"detail": "Session does not belong to this user"}, status=status.HTTP_403_FORBIDDEN)

        if not event_id or not user_id:
            return Response({"detail": "Invalid session metadata"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event_obj = Event.objects.get(id=event_id)
            ticket = Ticket.objects.create(
                event=event_obj,
                user=request.user,
                stripe_session_id=session_id,
            )
            ticket.generate_qr()
            return Response({"paid": True, "detail": "Ticket created", "ticket_id": str(ticket.id)})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
