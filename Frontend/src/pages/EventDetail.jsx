import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketState, setTicketState] = useState("idle"); // idle, paying, success, error
  const [ticketMsg, setTicketMsg] = useState("");

  useEffect(() => {
    api.get(`/events/${id}/`).then((res) => {
      setEvent(res.data);
      setLoading(false);
    }).catch(() => {
      setError("Event not found or not approved yet.");
      setLoading(false);
    });
  }, [id]);

  const handleDelete = () => {
    if (!window.confirm("Delete this event?")) return;
    api.delete(`/events/${id}/`).then(() => navigate("/events"));
  };

  const handleBuyTicket = () => {
    setTicketState("paying");
    api.post("/payments/create-checkout-session/", { event_id: id })
      .then((res) => {
        if (res.data.free) {
          setTicketState("success");
          setTimeout(() => navigate("/my-tickets"), 1500);
        } else if (res.data.checkout_url) {
          window.location.href = res.data.checkout_url;
        }
      })
      .catch((err) => {
        setTicketState("error");
        setTicketMsg(err.response?.data?.detail || "Payment initiation failed.");
        setTimeout(() => setTicketState("idle"), 3000);
      });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
      <div className="glass-dark p-8 rounded-2xl text-center border-red-500/30">
        <p className="text-red-400 font-bold text-xl">{error}</p>
        <Link to="/events" className="text-indigo-400 hover:text-indigo-300 mt-4 inline-block">Return to events</Link>
      </div>
    </div>
  );
  if (!event) return null;

  const isOwner = user && event.created_by === user.username;

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 -z-10 mix-blend-screen" />

      <header className="glass-dark border-b-0 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/events" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            &larr; Back to Events
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <h1 className="text-xl font-extrabold text-white tracking-tight">
            Events<span className="text-indigo-500">.ma</span>
          </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="glass-dark rounded-3xl border border-slate-700/50 overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.1)]">
          {event.image_url ? (
            <div className="w-full h-64 bg-slate-800 overflow-hidden relative">
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-b border-slate-800 relative" />
          )}

          <div className="p-8">
             {event.status === "PENDING" && (
                <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-10">
                  Pending Approval
                </div>
             )}

             <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">{event.title}</h1>
             <p className="text-indigo-300 font-medium text-lg flex items-center gap-2 mb-8">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
               {event.location}
             </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">About this Event</h3>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Date & Time</p>
                      <p className="text-slate-200 font-medium">{new Date(event.start_date).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Created by</p>
                      <p className="text-slate-200 font-medium">{event.created_by}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Availability</p>
                      <p className="text-emerald-400 font-bold">{event.capacity} Spots Total</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  {user && !isOwner && event.status === "APPROVED" ? (
                    ticketState === "idle" ? (
                      <button onClick={handleBuyTicket} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] hover-lift flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        {event.price && Number(event.price) > 0 ? `Buy Ticket - ${event.price} MAD` : "Get Free Ticket"}
                      </button>
                    ) : ticketState === "paying" ? (
                      <button disabled className="w-full py-4 bg-indigo-600/50 text-white rounded-xl cursor-not-allowed flex items-center justify-center gap-3 font-bold">
                         <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                         Processing Payment...
                      </button>
                    ) : ticketState === "success" ? (
                      <button disabled className="w-full py-4 bg-emerald-600 text-white rounded-xl cursor-default font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        Payment Successful! Redirecting...
                      </button>
                    ) : (
                      <button disabled className="w-full py-4 bg-red-600/50 text-white rounded-xl cursor-default font-bold border border-red-500/50">
                        {ticketMsg}
                      </button>
                    )
                  ) : !user ? (
                    <Link to="/login" className="w-full block text-center py-4 glass-dark hover:bg-slate-800 text-white rounded-xl transition-all font-bold border border-slate-700">
                      Sign in to Buy Tickets
                    </Link>
                  ) : null}

                  {isOwner && (
                    <button onClick={handleDelete} className="w-full py-3 mt-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors font-bold text-sm">
                      Cancel & Delete Event
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
