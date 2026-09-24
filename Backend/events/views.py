from rest_framework import generics, permissions
from .models import Event
from .serializers import EventSerializer
from .permissions import IsOwnerOrReadOnly
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.permissions import IsAdmin
from django.db.models import Q


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.select_related("created_by").all()
        if user.is_authenticated and user.is_admin:
            return queryset
        return queryset.filter(status="APPROVED")

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, status="APPROVED")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(location__icontains=search)
            )
        location = request.query_params.get("location", "").strip()
        if location:
            queryset = queryset.filter(location__icontains=location)
        event_type = request.query_params.get("event_type", "").strip()
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.select_related("created_by").all()
        if user.is_authenticated and user.is_admin:
            return queryset
        return queryset.filter(status="APPROVED")

    def perform_destroy(self, instance):
        instance.delete()

    def perform_update(self, serializer):
        serializer.save()


class EventApprovalView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, id):
        try:
            event = Event.objects.get(id=id)
        except Event.DoesNotExist:
            return Response({"detail": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status not in ["APPROVED", "REJECTED", "PENDING"]:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        event.status = new_status
        event.save()
        return Response({"detail": f"Event status updated to {new_status}."})


class AdminEventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Event.objects.select_related("created_by").all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, status="APPROVED")


class AdminEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    lookup_field = "id"
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Event.objects.select_related("created_by").all()
