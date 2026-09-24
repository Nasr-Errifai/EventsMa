from rest_framework import serializers
from .models import Ticket
from .download_service import get_qr_image_base64


class TicketSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source="event.title")
    event_date = serializers.ReadOnlyField(source="event.start_date")
    user_email = serializers.ReadOnlyField(source="user.email")

    class Meta:
        model = Ticket
        fields = (
            "id",
            "event",
            "event_title",
            "event_date",
            "user",
            "user_email",
            "status",
            "created_at",
        )
        read_only_fields = ("user", "status", "created_at")


class TicketQRSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source="event.title")
    qr_image = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = ("id", "event", "event_title", "qr_image", "qr_generated_at")

    def get_qr_image(self, obj):
        if not obj.qr_payload or not obj.qr_signature:
            obj.generate_qr()
        return get_qr_image_base64(obj)
