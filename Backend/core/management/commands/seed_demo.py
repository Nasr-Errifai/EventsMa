from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from events.models import Event
from tickets.models import Ticket


class Command(BaseCommand):
    help = "Create demo accounts, sample events and tickets"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        # Create demo accounts for every role
        demo_accounts = [
            {"email": "admin@example.com", "username": "admin", "role": "ADMIN", "password": "Admin123!"},
            {"email": "agent@example.com", "username": "agent", "role": "AGENT", "password": "Agent123!"},
            {"email": "client@example.com", "username": "client", "role": "CLIENT", "password": "Client123!"},
            {"email": "organizer@example.com", "username": "organizer", "role": "CLIENT", "password": "Organizer123!"},
        ]

        users = {}
        for account in demo_accounts:
            user, created = User.objects.get_or_create(
                email=account["email"],
                defaults={
                    "username": account["username"],
                    "role": account["role"],
                },
            )
            if created:
                user.set_password(account["password"])
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created {account['role']}: {account['email']}"))
            else:
                self.stdout.write(f"User {account['email']} already exists")
            users[account["email"]] = user

        # Create sample events
        now = timezone.now()
        event_data = [
            {
                "title": "Summer Music Festival",
                "description": "Annual music festival featuring local and international artists.",
                "event_type": "FESTIVAL",
                "location": "Casablanca Arena",
                "start_date": now + timedelta(days=30),
                "end_date": now + timedelta(days=32),
                "capacity": 5000,
                "price": 250.00,
                "status": "APPROVED",
                "created_by": users["organizer@example.com"],
            },
            {
                "title": "Tech Conference 2026",
                "description": "Leading technology conference with workshops and keynotes.",
                "event_type": "CONFERENCE",
                "location": "Grand Hotel, Rabat",
                "start_date": now + timedelta(days=45),
                "end_date": now + timedelta(days=46),
                "capacity": 500,
                "price": 500.00,
                "status": "APPROVED",
                "created_by": users["organizer@example.com"],
            },
            {
                "title": "Free Comedy Night",
                "description": "Join us for a night of laughs with top comedians.",
                "event_type": "COMEDY",
                "location": "Comedy Club, Marrakech",
                "start_date": now + timedelta(days=15),
                "end_date": now + timedelta(days=15, hours=3),
                "capacity": 200,
                "price": 0.00,
                "status": "APPROVED",
                "created_by": users["organizer@example.com"],
            },
            {
                "title": "Football Championship",
                "description": "Local football championship finals.",
                "event_type": "SPORT",
                "location": "Stade Mohammed V, Casablanca",
                "start_date": now + timedelta(days=60),
                "end_date": now + timedelta(days=60, hours=2),
                "capacity": 20000,
                "price": 100.00,
                "status": "PENDING",
                "created_by": users["organizer@example.com"],
            },
            {
                "title": "Art Exhibition",
                "description": "Contemporary art exhibition featuring Moroccan artists.",
                "event_type": "OTHER",
                "location": "Art Gallery, Tangier",
                "start_date": now - timedelta(days=10),
                "end_date": now - timedelta(days=5),
                "capacity": 300,
                "price": 50.00,
                "status": "APPROVED",
                "created_by": users["organizer@example.com"],
            },
        ]

        events = {}
        for data in event_data:
            event, created = Event.objects.get_or_create(
                title=data["title"],
                defaults=data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created event: {event.title}"))
            else:
                self.stdout.write(f"Event '{event.title}' already exists")
            events[event.title] = event

        # Create sample tickets for the client
        ticket_data = [
            {"event": events["Summer Music Festival"], "status": "VALID"},
            {"event": events["Free Comedy Night"], "status": "VALID"},
            {"event": events["Art Exhibition"], "status": "USED"},
        ]

        for data in ticket_data:
            ticket, created = Ticket.objects.get_or_create(
                event=data["event"],
                user=users["client@example.com"],
                defaults={"status": data["status"]},
            )
            if created:
                ticket.generate_qr()
                self.stdout.write(self.style.SUCCESS(f"Created ticket for: {ticket.event.title}"))
            else:
                self.stdout.write(f"Ticket already exists for: {ticket.event.title}")

        self.stdout.write(self.style.SUCCESS("\nDemo data seeded successfully!"))
        self.stdout.write("\nDemo accounts:")
        self.stdout.write("  Admin:     admin@example.com / Admin123!")
        self.stdout.write("  Agent:     agent@example.com / Agent123!")
        self.stdout.write("  Client:    client@example.com / Client123!")
        self.stdout.write("  Organizer: organizer@example.com / Organizer123!")
