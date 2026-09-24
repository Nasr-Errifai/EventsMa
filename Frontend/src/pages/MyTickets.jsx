import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";

const statusStyles = {
  VALID: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  USED: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
  CANCELED: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [searchParams] = useSearchParams();

  const loadTickets = () => {
    api.get("/tickets/")
      .then((res) => { setTickets(res.data); setLoading(false); setVerifying(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      setVerifying(true);
      const poll = setInterval(() => {
        api.post("/payments/verify-session/", { session_id })
          .then((res) => {
            if (res.data.paid) {
              clearInterval(poll);
              loadTickets();
            }
          })
          .catch(() => {});
      }, 1500);
      setTimeout(() => { clearInterval(poll); loadTickets(); }, 30000);
    } else {
      loadTickets();
    }
  }, []);

  const openQR = (ticketId) => {
    api.get(`/tickets/${ticketId}/qr/`).then((res) => {
      setQrModal(res.data);
    });
  };

  const closeQR = () => setQrModal(null);

  const downloadFile = (url, filename) => {
    api.get(url, { responseType: "blob" }).then((res) => {
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }).catch(() => {});
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 -z-10 mix-blend-screen" />

      <header className="glass-dark border-b-0 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold text-white hover:text-indigo-400 transition-colors">
            Events<span className="text-indigo-500">.ma</span>
          </Link>
          <ThemeToggle />
          <Link to="/events" className="text-sm text-indigo-400 hover:text-white transition-colors font-medium">
            Browse Events &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-4xl font-extrabold text-white mb-8 tracking-tight">My Tickets</h1>

        {loading || verifying ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            {verifying && <p className="text-slate-400 text-sm">Confirming your payment...</p>}
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass-dark p-12 rounded-2xl text-center border-dashed border-2 border-slate-700">
            <p className="text-slate-400 text-lg mb-4">You haven't bought any tickets yet.</p>
            <Link to="/events" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-500 transition-all">Find Events</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="glass-dark rounded-3xl border border-slate-700/50 p-6 flex flex-col hover-lift group"
              >
                <div className="flex-1 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${statusStyles[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {ticket.event_title}
                  </h2>
                  <p className="text-sm text-slate-400 mb-4">
                    {new Date(ticket.event_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => openQR(ticket.id)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2.5 rounded-xl transition-all font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  >
                    View QR
                  </button>
                  <Link
                    to={`/events/${ticket.event}`}
                    className="flex-1 text-center border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white text-sm py-2.5 rounded-xl transition-all font-bold"
                  >
                    Event
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {qrModal && (
        <div className="fixed inset-0 bg-[#0A0F1C]/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={closeQR}>
          <div className="glass-dark border border-slate-700 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.2)] p-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white truncate pr-4">
                {qrModal.event_title}
              </h3>
              <button onClick={closeQR} className="text-slate-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
            </div>
            
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center mb-6">
              <img src={qrModal.qr_image} alt="Ticket QR code" className="w-56 h-56" />
            </div>
            
            <p className="text-xs text-slate-500 text-center mb-6 font-medium">
              Generated: {qrModal.qr_generated_at ? new Date(qrModal.qr_generated_at).toLocaleString() : "N/A"}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => downloadFile(`/tickets/${qrModal.id}/qr/image/`, `ticket-${qrModal.id}.png`)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-3 rounded-xl transition-all font-bold"
              >
                Download Image
              </button>
              <button
                onClick={() => downloadFile(`/tickets/${qrModal.id}/qr/pdf/`, `ticket-${qrModal.id}.pdf`)}
                className="w-full border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white text-sm py-3 rounded-xl transition-all font-bold"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
