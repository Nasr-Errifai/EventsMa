from django.contrib.auth.management.commands.createsuperuser import (
    Command as BaseCreatesuperuser,
)
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCreatesuperuser):
    help = "Create a superuser with ADMIN role"

    def handle(self, *args, **options):
        super().handle(*args, **options)
        email = options.get("email") or input("Email: ")
        try:
            user = User.objects.get(email=email)
            if user.role != "ADMIN":
                user.role = "ADMIN"
                user.save(update_fields=["role"])
                self.stdout.write(self.style.SUCCESS(f"User {email} promoted to ADMIN"))
        except User.DoesNotExist:
            pass
