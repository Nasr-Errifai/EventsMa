import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ("CLIENT", "Client"),
        ("AGENT", "Agent"),
        ("ADMIN", "Admin"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=12, choices=ROLE_CHOICES, default="CLIENT")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email

    @property
    def is_admin(self):
        return self.role == "ADMIN"

    @property
    def is_agent(self):
        return self.role in ("AGENT", "ADMIN")

    @property
    def is_client(self):
        return self.role == "CLIENT"
