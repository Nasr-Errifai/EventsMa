import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function Home() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get("/events/")
      .then(res => setEvents(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-green-200/40 rounded-full blur-[120px] -translate-y-1/2 -z-10 mix-blend-multiply" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-green-100/50 rounded-full blur-[100px] translate-y-1/2 -z-10 mix-blend-multiply" />

      <header className="glass-dark border-b-0 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Events<span className="text-green-700">.ma</span>
          </h1>

          {user ? (
            <div className="flex items-center gap-6">
              <ThemeToggle />
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-semibold uppercase tracking-wide">
                {user.role}
              </span>
              <div className="flex items-center gap-4 text-sm font-medium text-zinc-600">
                {user.role === "ADMIN" && (
                  <Link to="/dashboard/admin" className="hover:text-green-700 transition-colors">Dashboard</Link>
                )}
                {user.role === "AGENT" && (
                  <Link to="/dashboard/agent" className="hover:text-green-700 transition-colors">Dashboard</Link>
                )}
                {(user.role === "AGENT" || user.role === "ADMIN") && (
                  <Link to="/scanner" className="hover:text-green-700 transition-colors">Scanner</Link>
                )}
                <Link to="/my-tickets" className="hover:text-green-700 transition-colors">Tickets</Link>
                <div className="w-px h-4 bg-green-200" />
                <span className="text-zinc-900">{user.username}</span>
                <button onClick={logout} className="text-zinc-500 hover:text-green-700 transition-colors">Logout</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <ThemeToggle />
              <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-green-700 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="text-sm font-semibold bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-green-800 to-green-600 leading-tight">
            Discover Extraordinary <br/> Experiences
          </h2>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            The ultimate marketplace for exclusive events. Whether you're looking to attend or organize, we provide a seamless, secure, and premium experience.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link to="/events" className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition-all hover-lift shadow-[0_0_30px_rgba(34,197,94,0.25)]">
              Explore Events
            </Link>
            {user?.role === "ADMIN" && (
              <Link to="/events/create" className="px-8 py-4 glass-dark text-green-700 font-bold rounded-full transition-all hover-lift hover:bg-green-50">
                Host an Event
              </Link>
            )}
          </div>
        </div>

        {events.length > 0 && (
          <div className="mt-20">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={24}
              slidesPerView={1}
              centeredSlides
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              navigation
              breakpoints={{
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="!pb-12"
            >
              {events.map((event) => (
                <SwiperSlide key={event.id}>
                  <Link to={`/events/${event.id}`} className="group block">
                    <div className="glass-dark rounded-2xl overflow-hidden border border-green-200/50 group-hover:border-green-400 transition-all hover-lift">
                      {event.image_url ? (
                        <div className="h-52 overflow-hidden">
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="h-52 bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                          <svg className="w-16 h-16 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-full">
                            {new Date(event.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-xs text-zinc-500">{event.capacity} spots</span>
                        </div>
                        <h4 className="text-lg font-bold text-zinc-900 group-hover:text-green-700 transition-colors mb-1">
                          {event.title}
                        </h4>
                        <p className="text-sm text-zinc-500 line-clamp-2">{event.description}</p>
                        <div className="flex items-center text-xs text-zinc-500 mt-4 pt-4 border-t border-green-100">
                          <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        <div className="mt-20">
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-2xl font-bold text-zinc-900">Upcoming Events</h3>
            <Link to="/events" className="text-green-700 hover:text-green-800 font-medium">View all &rarr;</Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <p className="text-zinc-500 col-span-3 text-center py-12 glass-dark rounded-2xl">No upcoming events found.</p>
            ) : (
              events.slice(0, 3).map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="glass-dark p-1 rounded-2xl hover-lift group block">
                  <div className="bg-white rounded-xl overflow-hidden h-full border border-green-100 group-hover:border-green-300 transition-colors">
                    {event.image_url ? (
                      <div className="w-full h-40 overflow-hidden">
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                        <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                          {new Date(event.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-zinc-500 text-sm">{event.capacity} spots</span>
                      </div>
                      <h4 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-green-700 transition-colors">{event.title}</h4>
                      <p className="text-zinc-500 text-sm mb-6 line-clamp-2">{event.description}</p>

                      <div className="flex items-center text-xs text-zinc-500 pt-4 border-t border-green-100">
                        <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                        {event.location}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

