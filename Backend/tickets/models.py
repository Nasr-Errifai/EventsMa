import uuid
import json
from django.utils import timezone
from django.db import models
from django.conf import settings
from .qr_service import generate_qr_base64


class Ticket(models.Model):
    STATUS_CHOICES = [
        ("VALID", "Valid"),
        ("USED", "Used"),
        ("CANCELED", "Canceled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, related_name="tickets")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="VALID")
    stripe_session_id = models.CharField(max_length=255, blank=True, default="", db_index=True)
    qr_payload = models.JSONField(null=True, blank=True)
    qr_signature = models.CharField(max_length=64, blank=True, default="")
    qr_generated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Ticket {self.id} — {self.event.title} ({self.user.email})"

    def generate_qr(self):
        qr_image_b64, payload, signature = generate_qr_base64(self)
        self.qr_payload = json.loads(payload)
        self.qr_signature = signature
        self.qr_generated_at = timezone.now()
        self.save(update_fields=["qr_payload", "qr_signature", "qr_generated_at"])
        return qr_image_b64


class ValidationLog(models.Model):
    RESULT_CHOICES = [
        ("SUCCESS", "Success"),
        ("FAILURE", "Failure"),
    ]
    MODE_CHOICES = [
        ("ONLINE", "Online"),
        ("OFFLINE", "Offline"),
    ]
    SYNC_CHOICES = [
        ("PENDING", "Pending"),
        ("SYNCED", "Synced"),
        ("CONFLICT", "Conflict"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.SET_NULL, null=True, blank=True, related_name="validation_logs")
    ticket_id_raw = models.CharField(max_length=36, blank=True, default="")
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    validated_at = models.DateTimeField(auto_now_add=True)
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    reason = models.CharField(max_length=255, blank=True, default="")
    validation_mode = models.CharField(max_length=10, choices=MODE_CHOICES, default="ONLINE")
    sync_status = models.CharField(max_length=10, choices=SYNC_CHOICES, default="PENDING")

    class Meta:
        ordering = ["-validated_at"]

    def __str__(self):
        return f"Validation {self.result} ({self.validation_mode}) — {self.ticket_id} at {self.validated_at}"
