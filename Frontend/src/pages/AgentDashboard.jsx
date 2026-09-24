import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";

function StatCard({ title, value, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/agent/")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Failed to load dashboard.</p>
      </div>
    );
  }

  const todayRate = data.today_validations > 0
    ? Math.round((data.today_success / data.today_validations) * 100)
    : 0;
  const totalRate = data.total_validations > 0
    ? Math.round((data.total_success / data.total_validations) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/scanner" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Scanner
            </Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-800">
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Today's Scans" value={data.today_validations} />
          <StatCard title="Today's Success" value={data.today_success} color="green" />
          <StatCard title="Today's Failed" value={data.today_failure} color="red" />
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-700 opacity-80">Today's Rate</p>
            <p className="text-3xl font-bold text-purple-700 mt-1">{todayRate}%</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All-Time Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.total_validations}</p>
                <p className="text-xs text-gray-500">Total Scans</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{data.total_success}</p>
                <p className="text-xs text-gray-500">Success</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{data.total_failure}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overall success rate</span>
                <span className="font-bold text-green-600">{totalRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${totalRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">By Mode</h2>
            {data.by_mode.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.by_mode.map((m) => (
                  <div key={m.mode} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${m.mode === "ONLINE" ? "bg-green-500" : "bg-amber-500"}`} />
                      <span className="text-sm font-medium text-gray-700">{m.mode}</span>
                    </div>
                    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{m.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Validations</h2>
          {data.recent_validations.length === 0 ? (
            <p className="text-gray-500 text-sm">No validations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Result</th>
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Mode</th>
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Reason</th>
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_validations.map((v) => (
                    <tr key={v.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          v.result === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {v.result}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{v.validation_mode}</td>
                      <td className="py-2 px-3 text-gray-500">{v.reason}</td>
                      <td className="py-2 px-3 text-gray-500">{new Date(v.validated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
