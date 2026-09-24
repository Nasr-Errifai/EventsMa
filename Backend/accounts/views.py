from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    AdminUserSerializer,
)
from .permissions import IsAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            email = request.data.get("email", request.data.get("username"))
            try:
                user = User.objects.get(email=email) if "@" in str(email) else User.objects.get(username=email)
                if not user.is_active:
                    return Response(
                        {"detail": "This account has been deactivated. Contact an admin."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except User.DoesNotExist:
                pass
        return response


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if not self.request.user.is_active:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("This account has been deactivated.")
        return self.request.user


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.all().order_by("-date_joined")


class AdminUserDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    lookup_field = "id"

    def get_queryset(self):
        return User.objects.all()

    def destroy(self, request, id):
        try:
            target = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if str(target.id) == str(request.user.id):
            return Response(
                {"detail": "Cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target.role == "ADMIN":
            admin_count = User.objects.filter(role="ADMIN", is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {"detail": "Cannot delete the last admin."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        target.delete()

        return Response(
            {"detail": "User deleted successfully", "user_id": str(target.id)},
            status=status.HTTP_200_OK,
        )


class AdminAssignRoleView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, id):
        return self._handle_role_change(request, id)

    def patch(self, request, id):
        return self._handle_role_change(request, id)

    def _handle_role_change(self, request, id):
        new_role = request.data.get("role")
        valid_roles = ["CLIENT", "AGENT", "ADMIN"]
        if new_role not in valid_roles:
            return Response(
                {"detail": f"Invalid role. Must be one of: {', '.join(valid_roles)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if str(user.id) == str(request.user.id) and new_role != "ADMIN":
            return Response(
                {"detail": "Cannot change your own admin role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.role == "ADMIN" and new_role != "ADMIN":
            admin_count = User.objects.filter(role="ADMIN", is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {"detail": "Cannot demote the last active admin."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        user.role = new_role
        user.save(update_fields=["role"])
        return Response({"detail": f"Role updated to {new_role}", "user_id": str(user.id), "role": user.role})

