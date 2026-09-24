from django.urls import path
from dashboard.views import (
    AdminDashboardView,
    AgentDashboardView,
)

urlpatterns = [
    path("dashboard/admin/", AdminDashboardView.as_view(), name="dashboard-admin"),
    path("dashboard/agent/", AgentDashboardView.as_view(), name="dashboard-agent"),
]
