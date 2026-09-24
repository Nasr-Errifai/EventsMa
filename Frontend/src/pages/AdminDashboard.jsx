import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";

function StatCard({ title, value, color = "indigo", icon }) {
  const colors = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return (
    <div className={`glass-dark rounded-2xl border p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1 text-white">{value}</p>
        </div>
        {icon && <span className="text-3xl opacity-40">{icon}</span>}
      </div>
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <p className="text-slate-500 text-sm">No data</p>;
  let cumulative = 0;
  const gradientParts = [];
  for (const seg of segments) {
    const start = (cumulative / total) * 100;
    cumulative += seg.value;
    const end = (cumulative / total) * 100;
    gradientParts.push(`${seg.color} ${start}% ${end}%`);
  }
  return (
    <div className="flex items-center gap-6">
      <div
        className="w-24 h-24 rounded-full"
        style={{ background: `conic-gradient(${gradientParts.join(", ")})` }}
      />
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-slate-400">{seg.label}: {seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [adminEvents, setAdminEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [roleModal, setRoleModal] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [roleMsg, setRoleMsg] = useState("");
  const [approveMsg, setApproveMsg] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/admin/"),
      api.get("/admin/events/"),
      api.get("/users/"),
    ]).then(([d1, d2, d3]) => {
      setData(d1.data);
      setAdminEvents(d2.data);
      setUsers(d3.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleApprove = (eventId, status) => {
    api.post(`/events/${eventId}/approve/`, { status }).then((res) => {
      setApproveMsg(res.data.detail);
      setTimeout(() => setApproveMsg(""), 3000);
      api.get("/admin/events/").then((r) => setAdminEvents(r.data));
    });
  };

  const handleDeleteEvent = (eventId) => {
    if (!window.confirm("Delete this event?")) return;
    api.delete(`/admin/events/${eventId}/`).then(() => {
      setAdminEvents((prev) => prev.filter((e) => e.id !== eventId));
    });
  };

  const handleAssignRole = (userId) => {
    api.patch(`/users/${userId}/assign-role/`, { role: newRole }).then((res) => {
      setRoleMsg(res.data.detail);
      setRoleModal(null);
      setNewRole("");
      setTimeout(() => setRoleMsg(""), 3000);
      api.get("/users/").then((r) => setUsers(r.data));
    }).catch((err) => {
      setRoleMsg(err.response?.data?.detail || "Failed");
    });
  };

  const handleDeleteUser = (userId) => {
    if (!window.confirm("Delete this user permanently? This action cannot be undone.")) return;
    api.delete(`/users/${userId}/`).then((res) => {
      setRoleMsg(res.data.detail);
      setTimeout(() => setRoleMsg(""), 3000);
      api.get("/users/").then((r) => setUsers(r.data));
    }).catch((err) => {
      setRoleMsg(err.response?.data?.detail || "Failed to delete user");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <p className="text-slate-400">Failed to load dashboard.</p>
      </div>
    );
  }

  const successRate = data.total_validations > 0
    ? Math.round((data.successful_validations / data.total_validations) * 100)
    : 0;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "events", label: `Events (${adminEvents.length})` },
    { key: "users", label: `Users (${users.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 -z-10 mix-blend-screen" />

      <header className="glass-dark border-b-0 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Admin<span className="text-indigo-500">.ma</span>
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">Home</Link>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded-full font-bold">{user?.role}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.key
                  ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                  : "glass-dark text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {approveMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium">
            {approveMsg}
          </div>
        )}
        {roleMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium">
            {roleMsg}
          </div>
        )}
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Users" value={data.total_users} icon="👥" />
              <StatCard title="Total Events" value={data.total_events} icon="📅" color="green" />
              <StatCard title="Total Tickets" value={data.total_tickets} icon="🎫" color="amber" />

            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-dark rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Users by Role</h2>
                <div className="space-y-3">
                  {data.users_by_role.map((r) => (
                    <div key={r.role} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300">{r.role}</span>
                      <span className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-dark rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Ticket Status</h2>
                <DonutChart segments={[
                  { label: "Valid", value: data.tickets_valid, color: "#10b981" },
                  { label: "Used", value: data.tickets_used, color: "#6366f1" },
                ]} />
              </div>

              <div className="glass-dark rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Validation Rate</h2>
                <div className="text-center py-4">
                  <p className="text-5xl font-bold text-emerald-400">{successRate}%</p>
                  <p className="text-sm text-slate-500 mt-2">{data.successful_validations} / {data.total_validations} successful</p>
                </div>
              </div>
            </div>

            <div className="glass-dark rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Events per User</h2>
              {data.events_per_organizer.length === 0 ? (
                <p className="text-slate-500 text-sm">No events yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.events_per_organizer.map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">{item.username || item.email}</span>
                      <span className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{item.event_count} events</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-dark rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Recent Validations</h2>
              {data.recent_validations.length === 0 ? (
                <p className="text-slate-500 text-sm">No validations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-2 px-3 text-slate-500 font-medium">Result</th>
                        <th className="text-left py-2 px-3 text-slate-500 font-medium">Mode</th>
                        <th className="text-left py-2 px-3 text-slate-500 font-medium">Agent</th>
                        <th className="text-left py-2 px-3 text-slate-500 font-medium">Reason</th>
                        <th className="text-left py-2 px-3 text-slate-500 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_validations.map((v) => (
                        <tr key={v.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              v.result === "SUCCESS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}>
                              {v.result}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400">{v.validation_mode}</td>
                          <td className="py-2 px-3 text-slate-400">{v.validated_by__email}</td>
                          <td className="py-2 px-3 text-slate-500">{v.reason}</td>
                          <td className="py-2 px-3 text-slate-500">{new Date(v.validated_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "events" && (
          <div className="glass-dark rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-bold text-white mb-4">All Events</h2>
            {adminEvents.length === 0 ? (
              <p className="text-slate-500 text-sm">No events yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Title</th>
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Created by</th>
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Status</th>
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Date</th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminEvents.map((ev) => (
                      <tr key={ev.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                        <td className="py-3 px-3 text-white font-medium">{ev.title}</td>
                        <td className="py-3 px-3 text-slate-400">{ev.created_by}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            ev.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                            ev.status === "REJECTED" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                            "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{new Date(ev.start_date).toLocaleDateString()}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex gap-2 justify-end">
                            {ev.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApprove(ev.id, "APPROVED")}
                                  className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-600/30 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApprove(ev.id, "REJECTED")}
                                  className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-600/30 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="px-3 py-1 bg-red-600/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-600/20 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="glass-dark rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-bold text-white mb-4">User Management</h2>
            {users.length === 0 ? (
              <p className="text-slate-500 text-sm">No users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Username</th>
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Email</th>
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Role</th>
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Status</th>
                      <th className="text-left py-2 px-3 text-slate-500 font-medium">Joined</th>
                      <th className="text-right py-2 px-3 text-slate-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={`border-b border-slate-800/50 ${!u.is_active ? "opacity-50" : "hover:bg-slate-900/50"}`}>
                        <td className="py-3 px-3 text-white font-medium">{u.username}</td>
                        <td className="py-3 px-3 text-slate-400">{u.email}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            u.is_active
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}>
                            {u.is_active ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "-"}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setRoleModal(u.id); setNewRole(u.role); }}
                              className="px-3 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-bold hover:bg-indigo-600/30 transition-colors"
                            >
                              Change Role
                            </button>
                            {u.is_active ? (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-3 py-1 bg-red-600/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-600/20 transition-colors"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {roleModal && (
        <div className="fixed inset-0 bg-[#0A0F1C]/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setRoleModal(null)}>
          <div className="glass-dark border border-slate-700 rounded-3xl p-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6">Assign Role</h3>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            >
              <option value="CLIENT">CLIENT</option>
              <option value="AGENT">AGENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => handleAssignRole(roleModal)}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setRoleModal(null)}
                className="flex-1 py-3 glass-dark text-slate-300 rounded-xl hover:bg-slate-800 font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
