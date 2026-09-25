import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Event

User = get_user_model()


@pytest.mark.django_db
class TestEventModel:
    def setup_method(self):
        self.user = User.objects.create_user(
            email="organizer@example.com",
            username="organizer",
            password="TestPass123!",
        )

    def test_create_event(self):
        event = Event.objects.create(
            title="Test Event",
            description="A test event",
            event_type="CONCERT",
            location="Test Location",
            start_date=timezone.now() + timedelta(days=7),
            end_date=timezone.now() + timedelta(days=8),
            capacity=100,
            price=50.00,
            status="APPROVED",
            created_by=self.user,
        )
        assert event.title == "Test Event"
        assert event.status == "APPROVED"

    def test_event_str(self):
        event = Event.objects.create(
            title="Test Event",
            description="A test event",
            location="Test Location",
            start_date=timezone.now() + timedelta(days=7),
            end_date=timezone.now() + timedelta(days=8),
            capacity=100,
            created_by=self.user,
        )
        assert "Test Event" in str(event)
