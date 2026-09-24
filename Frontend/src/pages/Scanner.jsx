import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import offlineQueue from "../utils/offlineQueue";
import ThemeToggle from "../components/ThemeToggle";

export default function Scanner() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(offlineQueue.getQueueCount());
  const scannedRef = useRef(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        scanner.clear();

        let parsed;
        try {
          parsed = JSON.parse(decodedText);
        } catch {
          setResult({ valid: false, message: "Invalid QR code format", mode: "online" });
          return;
        }

        if (isOnline) {
          setLoading(true);
          api
            .post("/tickets/validate/", {
              qr_payload: JSON.stringify(parsed),
              qr_signature: parsed.signature,
            })
            .then((res) => setResult({ ...res.data, mode: "online" }))
            .catch((err) => {
              const data = err.response?.data || { message: "Validation failed" };
              setResult({ valid: false, message: data.message, mode: "online" });
            })
            .finally(() => setLoading(false));
        } else {
          const localTicket = offlineQueue.findOfflineTicket(parsed.ticket_id);
          if (!localTicket) {
            setResult({ valid: false, message: "Ticket not in offline cache. Download event data first.", mode: "offline" });
            return;
          }

          const sigMatch = localTicket.qr_signature === parsed.signature;
          if (!sigMatch) {
            offlineQueue.enqueueScan(parsed.ticket_id, JSON.stringify(parsed), parsed.signature);
            setQueueCount(offlineQueue.getQueueCount());
            setResult({ valid: false, message: "Signature mismatch (cached)", mode: "offline" });
            return;
          }

          const prevScans = offlineQueue.getQueue();
          const alreadyUsed = prevScans.some((s) => s.ticket_id === parsed.ticket_id);
          if (alreadyUsed) {
            setResult({ valid: false, message: "Ticket already scanned offline", mode: "offline" });
            return;
          }

          offlineQueue.enqueueScan(parsed.ticket_id, JSON.stringify(parsed), parsed.signature);
          setQueueCount(offlineQueue.getQueueCount());
          const ticketData = JSON.parse(localTicket.qr_payload);
          const offlineTicketsData = offlineQueue.getOfflineTickets();
          setResult({
            valid: true,
            message: "Ticket validated (offline)",
            event_title: offlineTicketsData?.event_title || "",
            mode: "offline",
          });
        }
      },
      () => {}
    );

    return () => {
      try { scanner.clear(); } catch {}
    };
  }, [user, isOnline]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Sign in to scan tickets.</p>
      </div>
    );
  }

  const resetScan = () => {
    setResult(null);
    scannedRef.current = false;
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col">
      <header className="glass-dark border-b-0 py-4 px-6 flex items-center justify-between z-10 relative">
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          Scanner<span className="text-indigo-500">.ma</span>
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
            isOnline ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {isOnline ? "Online" : "Offline"}
          </span>
          {queueCount > 0 && (
            <Link to="/sync-scans" className="text-[10px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
              {queueCount} sync
            </Link>
          )}
          <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Exit</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px] -z-10" />

        {!result && !loading && (
          <div className="w-full max-w-sm">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Scan Ticket</h2>
              <p className="text-slate-400 text-sm">Align QR code within the frame</p>
            </div>
            <div className="glass-dark p-2 rounded-3xl overflow-hidden border border-slate-700/50 shadow-[0_0_40px_rgba(79,70,229,0.15)]">
              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden bg-black" />
            </div>
          </div>
        )}

        {loading && (
          <div className="glass-dark rounded-3xl p-8 text-center max-w-sm w-full border border-indigo-500/30">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-indigo-300 font-medium animate-pulse">Validating ticket...</p>
          </div>
        )}

        {result && (
          <div className={`glass-dark rounded-3xl p-8 text-center max-w-sm w-full border-2 ${
            result.valid ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]" : "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          }`}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center border-4 ${
              result.valid ? "bg-emerald-500/20 border-emerald-500/50" : "bg-red-500/20 border-red-500/50"
            }`}>
              {result.valid ? (
                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            <h2 className={`text-2xl font-black uppercase tracking-wider mb-2 ${result.valid ? "text-emerald-400" : "text-red-400"}`}>
              {result.valid ? "Valid Ticket" : "Invalid"}
            </h2>

            <p className="text-slate-300 font-medium mb-4">{result.message}</p>

            {result.event_title && (
              <div className="bg-slate-900/50 rounded-xl p-3 mb-6 border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Event</p>
                <p className="text-sm text-slate-200 font-semibold">{result.event_title}</p>
              </div>
            )}
            
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-8">
              Mode: <span className="text-indigo-400">{result.mode === "offline" ? "Offline (queued)" : "Online"}</span>
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={resetScan}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                Scan Next Ticket
              </button>
              {queueCount > 0 && (
                <Link
                  to="/sync-scans"
                  className="w-full py-4 glass-dark text-white rounded-xl transition-all font-bold hover:bg-slate-800"
                >
                  Sync Scans ({queueCount})
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
