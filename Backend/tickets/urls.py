from django.urls import path
from tickets.views import (
    TicketListView,
    TicketDetailView,
    TicketQRView,
    TicketValidateView,
    TicketQRImageView,
    TicketPDFView,
    EventOfflineDataView,
    TicketSyncView,
)
from tickets.payments_views import CreateCheckoutSessionView, StripeWebhookView, VerifyPaymentSessionView

urlpatterns = [
    path("tickets/", TicketListView.as_view(), name="ticket-list"),
    path("tickets/<uuid:id>/", TicketDetailView.as_view(), name="ticket-detail"),
    path("tickets/<uuid:id>/qr/", TicketQRView.as_view(), name="ticket-qr"),
    path("tickets/validate/", TicketValidateView.as_view(), name="ticket-validate"),
    path("tickets/<uuid:id>/qr/image/", TicketQRImageView.as_view(), name="ticket-qr-image"),
    path("tickets/<uuid:id>/qr/pdf/", TicketPDFView.as_view(), name="ticket-pdf"),
    path("events/<uuid:id>/offline-data/", EventOfflineDataView.as_view(), name="event-offline-data"),
    path("tickets/sync/", TicketSyncView.as_view(), name="ticket-sync"),
    path("payments/create-checkout-session/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("payments/webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("payments/verify-session/", VerifyPaymentSessionView.as_view(), name="verify-payment-session"),
]
