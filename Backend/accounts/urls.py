from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    RegisterView,
    LoginView,
    MeView,
    AdminUserListView,
    AdminUserDetailView,
    AdminAssignRoleView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<int:id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("users/<int:id>/assign-role/", AdminAssignRoleView.as_view(), name="admin-assign-role"),
]
