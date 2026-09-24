import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "OTHER",
    location: "",
    start_date: "",
    end_date: "",
    capacity: "",
    price: "0",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("event_type", form.event_type);
    formData.append("location", form.location);
    formData.append("start_date", form.start_date);
    formData.append("end_date", form.end_date);
    formData.append("capacity", parseInt(form.capacity, 10));
    formData.append("price", parseFloat(form.price));
    if (imageFile) {
      formData.append("image", imageFile);
    }
    api
      .post("/events/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => navigate(`/events/${res.data.id}`))
      .catch((err) => {
        setLoading(false);
        if (err.response?.data) {
          const msgs = err.response.data;
          setError(typeof msgs === "object" ? Object.values(msgs).flat().join(" ") : msgs);
        } else {
          setError("Failed to create event");
        }
      });
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 -z-10 mix-blend-screen" />

      <header className="glass-dark border-b-0 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold text-white tracking-tight hover:text-indigo-400 transition-colors">
            Events<span className="text-indigo-500">.ma</span>
          </Link>
          <ThemeToggle />
          <span className="text-xs uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-full font-bold">
            {user?.role}
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Create Event</h1>
          <p className="text-slate-400">Propose a new event to the platform. It will be reviewed by an admin.</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 glass-dark border border-red-500/30 text-red-400 rounded-xl font-medium shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-dark rounded-3xl border border-slate-700/50 p-8 space-y-6 shadow-[0_0_40px_rgba(79,70,229,0.1)]">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Event Title</label>
              <input id="title" name="title" type="text" value={form.title} onChange={handleChange} required
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all" placeholder="E.g. Tech Conference 2026" />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Description</label>
              <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} required
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all resize-none" placeholder="Tell attendees what to expect..." />
            </div>

            <div>
              <label htmlFor="event_type" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Event Type</label>
              <select id="event_type" name="event_type" value={form.event_type} onChange={handleChange} required
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all">
                <option value="CONCERT">Concert</option>
                <option value="FESTIVAL">Festival</option>
                <option value="SPORT">Sport</option>
                <option value="THEATRE">Theatre</option>
                <option value="COMEDY">Comedy</option>
                <option value="CONFERENCE">Conference</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="image" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Event Image</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-slate-800 cursor-pointer transition-all flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-400 text-sm">{imageFile ? imageFile.name : "Choose image..."}</span>
                  <input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Location</label>
              <input id="location" name="location" type="text" value={form.location} onChange={handleChange} required
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all" placeholder="City or Venue name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Start Date & Time</label>
                <input id="start_date" name="start_date" type="datetime-local" value={form.start_date} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all [color-scheme:dark]" />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">End Date & Time</label>
                <input id="end_date" name="end_date" type="datetime-local" value={form.end_date} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all [color-scheme:dark]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="capacity" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Total Capacity</label>
                <input id="capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all" placeholder="E.g. 100" />
              </div>
              <div>
                <label htmlFor="price" className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Price (MAD)</label>
                <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-slate-500 transition-all" placeholder="0 for Free" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-800">
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl transition-all font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover-lift disabled:opacity-50">
              {loading ? "Submitting..." : "Submit Event"}
            </button>
            <Link to="/events"
              className="sm:w-32 text-center py-3.5 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-bold">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
