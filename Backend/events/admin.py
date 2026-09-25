from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_type", "status", "start_date", "capacity", "price", "created_by")
    list_filter = ("status", "event_type")
    search_fields = ("title", "description", "location")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")
