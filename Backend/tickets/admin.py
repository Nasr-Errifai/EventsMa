from django.contrib import admin
from .models import Ticket, ValidationLog


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("id", "event", "user", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("user__email", "event__title")
    ordering = ("-created_at",)
    readonly_fields = ("qr_payload", "qr_signature", "qr_generated_at", "created_at")


@admin.register(ValidationLog)
class ValidationLogAdmin(admin.ModelAdmin):
    list_display = ("ticket", "validated_by", "result", "validation_mode", "sync_status", "validated_at")
    list_filter = ("result", "validation_mode", "sync_status")
    search_fields = ("ticket__id", "validated_by__email")
    ordering = ("-validated_at",)
    readonly_fields = ("validated_at",)
