import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import offlineQueue from "../utils/offlineQueue";
import ThemeToggle from "../components/ThemeToggle";

export default function SyncScans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setQueue(offlineQueue.getQueue());
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get("/events/").then((res) => setEvents(res.data)).catch(() => {});
  }, [user]);

  const downloadOfflineData = () => {
    if (!eventId) return;
    setDownloading(true);
    setDownloadResult(null);
    api
      .get(`/events/${eventId}/offline-data/`)
      .then((res) => {
        offlineQueue.storeOfflineTickets(res.data.event_id, res.data.tickets, res.data.event_title);
        setDownloadResult({ ok: true, message: `Downloaded ${res.data.total_valid_tickets} tickets for "${res.data.event_title}"` });
      })
      .catch((err) => {
        setDownloadResult({ ok: false, message: err.response?.data?.detail || "Failed to download data" });
      })
      .finally(() => setDownloading(false));
  };

  const syncScans = () => {
    const currentQueue = offlineQueue.getQueue();
    if (currentQueue.length === 0) return;
    setSyncing(true);
    setSyncResult(null);
    const payload = {
      scans: currentQueue.map((s) => ({
        ticket_id: s.ticket_id,
        scanned_at: s.scanned_at,
      })),
      device_id: offlineQueue.getDeviceId(),
    };
    api
      .post("/tickets/sync/", payload)
      .then((res) => {
        if (res.data.synced_count > 0) {
          const syncedSet = new Set(res.data.synced_ids);
          const remaining = currentQueue.filter((s) => !syncedSet.has(s.ticket_id));
          offlineQueue.clearQueue();
          remaining.forEach((s) => offlineQueue.enqueueScan(s.ticket_id, s.qr_payload, s.qr_signature));
          setQueue(offlineQueue.getQueue());
        }
        setSyncResult(res.data);
      })
      .catch((err) => {
        setSyncResult({ error: err.response?.data?.detail || "Sync failed" });
      })
      .finally(() => setSyncing(false));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Sign in to sync scans.</p>
      </div>
    );
  }

  const offlineData = offlineQueue.getOfflineTickets();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-indigo-600">
            Event Platform
          </Link>
          <ThemeToggle />
          <Link to="/scanner" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Back to Scanner
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Sync Offline Scans
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Download Event Data</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download ticket data for an event to enable offline validation.
          </p>
          <div className="flex gap-2">
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select an event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            <button
              onClick={downloadOfflineData}
              disabled={!eventId || downloading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {downloading ? "Downloading..." : "Download"}
            </button>
          </div>
          {downloadResult && (
            <div className={`mt-3 text-sm p-2 rounded ${downloadResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {downloadResult.message}
            </div>
          )}
        </div>

        {offlineData && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Offline Cache</h2>
            <p className="text-sm text-gray-600">
              Event: <span className="font-medium">{offlineData.event_title}</span>
            </p>
            <p className="text-sm text-gray-600">
              Cached tickets: <span className="font-medium">{offlineData.tickets.length}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Synced at: {new Date(offlineData.synced_at).toLocaleString()}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending Scans</h2>
          {queue.length === 0 ? (
            <p className="text-gray-500 text-sm">No offline scans to sync.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {queue.length} scan{queue.length > 1 ? "s" : ""} queued for sync.
              </p>
              <button
                onClick={syncScans}
                disabled={syncing}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-center"
              >
                {syncing ? "Syncing..." : `Sync ${queue.length} scan${queue.length > 1 ? "s" : ""}`}
              </button>
            </>
          )}
        </div>

        {syncResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {syncResult.error ? "Sync Error" : "Sync Results"}
            </h2>
            {syncResult.error ? (
              <p className="text-sm text-red-600">{syncResult.error}</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Synced:</span>
                  <span className="font-semibold text-green-600">{syncResult.synced_count}</span>
                </div>
                {syncResult.conflicts.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-600 mb-2">
                      Conflicts ({syncResult.conflicts.length}):
                    </p>
                    <div className="space-y-2">
                      {syncResult.conflicts.map((c, i) => (
                        <div key={i} className="text-xs bg-red-50 text-red-700 p-2 rounded">
                          <span className="font-mono">{c.ticket_id.slice(0, 8)}...</span>
                          <span className="ml-2">{c.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
