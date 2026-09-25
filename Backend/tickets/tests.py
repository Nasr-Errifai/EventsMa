import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from events.models import Event
from .models import Ticket, ValidationLog

User = get_user_model()


@pytest.mark.django_db
class TestTicketModel:
    def setup_method(self):
        self.user = User.objects.create_user(
            email="client@example.com",
            username="client",
            password="TestPass123!",
        )
        self.event = Event.objects.create(
            title="Test Event",
            description="A test event",
            location="Test Location",
            start_date=timezone.now() + timedelta(days=7),
            end_date=timezone.now() + timedelta(days=8),
            capacity=100,
            created_by=self.user,
        )

    def test_create_ticket(self):
        ticket = Ticket.objects.create(
            event=self.event,
            user=self.user,
        )
        assert ticket.status == "VALID"
        assert ticket.event == self.event

    def test_ticket_str(self):
        ticket = Ticket.objects.create(
            event=self.event,
            user=self.user,
        )
        assert "Test Event" in str(ticket)


@pytest.mark.django_db
class TestValidationLogModel:
    def setup_method(self):
        self.user = User.objects.create_user(
            email="client@example.com",
            username="client",
            password="TestPass123!",
        )
        self.event = Event.objects.create(
            title="Test Event",
            description="A test event",
            location="Test Location",
            start_date=timezone.now() + timedelta(days=7),
            end_date=timezone.now() + timedelta(days=8),
            capacity=100,
            created_by=self.user,
        )
        self.ticket = Ticket.objects.create(
            event=self.event,
            user=self.user,
        )

    def test_create_validation_log(self):
        log = ValidationLog.objects.create(
            ticket=self.ticket,
            validated_by=self.user,
            result="SUCCESS",
        )
        assert log.result == "SUCCESS"
        assert log.ticket == self.ticket
