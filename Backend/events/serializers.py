from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source="created_by.username")
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id", "title", "description", "event_type", "location", "start_date",
            "end_date", "capacity", "price", "status", "image",
            "image_url", "created_by", "created_at", "updated_at",
        )
        read_only_fields = ("status", "created_by", "created_at", "updated_at")

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
