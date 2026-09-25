import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="TestPass123!",
        )
        assert user.email == "test@example.com"
        assert user.role == "CLIENT"
        assert user.is_client

    def test_create_admin(self):
        user = User.objects.create_superuser(
            email="admin@example.com",
            username="admin",
            password="AdminPass123!",
        )
        # Superusers are staff by default; role is set to ADMIN by the management command
        assert user.is_staff
        # Manually set role to ADMIN for test
        user.role = "ADMIN"
        user.save(update_fields=["role"])
        assert user.is_admin

    def test_user_str(self):
        user = User.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="TestPass123!",
        )
        assert str(user) == "test@example.com"
