from django.urls import path
from events.views import (
    EventListCreateView, EventDetailView, EventApprovalView,
    AdminEventListCreateView, AdminEventDetailView,
)

urlpatterns = [
    path("events/", EventListCreateView.as_view(), name="event-list-create"),
    path("events/<uuid:id>/", EventDetailView.as_view(), name="event-detail"),
    path("events/<uuid:id>/approve/", EventApprovalView.as_view(), name="event-approve"),
    path("admin/events/", AdminEventListCreateView.as_view(), name="admin-event-list-create"),
    path("admin/events/<uuid:id>/", AdminEventDetailView.as_view(), name="admin-event-detail"),
]
