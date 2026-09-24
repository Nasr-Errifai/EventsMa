import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const EVENT_TYPES = [
    { value: "", label: "All" },
    { value: "CONCERT", label: "Concert" },
    { value: "FESTIVAL", label: "Festival" },
    { value: "SPORT", label: "Sport" },
    { value: "THEATRE", label: "Theatre" },
    { value: "COMEDY", label: "Comedy" },
    { value: "CONFERENCE", label: "Conference" },
    { value: "OTHER", label: "Other" },
  ];

  const fetchEvents = (query = "", type = "") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.append("search", query);
    if (type) params.append("event_type", type);
    const qs = params.toString();
    api.get(`/events/${qs ? `?${qs}` : ""}`).then((res) => {
      setEvents(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents(search, typeFilter);
  };

  const handleTypeClick = (type) => {
    setTypeFilter(type);
    fetchEvents(search, type);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 -z-10 mix-blend-screen" />

      <header className="glass-dark border-b-0 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold text-white tracking-tight hover:text-indigo-400 transition-colors">
            Events<span className="text-indigo-500">.ma</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {(user?.role === "ORGANIZER" || user?.role === "ADMIN") ? (
              <Link
                to="/events/create"
                className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition-all font-semibold shadow-[0_0_15px_rgba(79,70,229,0.4)]"
              >
                + Create Event
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Explore Events</h1>
          <p className="text-slate-400 text-lg">Find the best experiences happening around you.</p>

          <form onSubmit={handleSearch} className="mt-6 flex gap-3 max-w-xl">
            <input
              type="text"
              placeholder="Search events by title, description, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)]"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTypeClick(t.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
                  typeFilter === t.value
                    ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-lg">No events found right now.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="glass-dark p-1 rounded-2xl hover-lift group block"
              >
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group-hover:border-indigo-500/30 transition-colors flex flex-col">
                  {event.image_url ? (
                    <div className="w-full h-40 bg-slate-800 overflow-hidden">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center">
                      <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                        {new Date(event.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-slate-500 text-sm">{event.capacity} spots</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {event.title}
                    </h2>
                    <p className="text-slate-400 text-sm mb-6 line-clamp-2 flex-grow">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        {event.location}
                      </div>
                      <span>by {event.created_by}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
