import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import type { Temple } from "../types";

type QueueStats = {
  waiting: number;
  called: number;
  completed: number;
};

type TempleDashboardRow = {
  templeId: string;
  templeName: string;
  occupancyPercent: number;
  currentOccupancy: number;
  totalCapacity: number;
  stats: QueueStats;
};

function AdminDashboardPage() {
  const [rows, setRows] = useState<TempleDashboardRow[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshDashboard = async () => {
    try {
      setIsRefreshing(true);
      setError("");

      const templesData = await apiRequest<{ temples: Temple[] }>("/temples");
      const statsList = await Promise.all(
        templesData.temples.map(async (temple) => {
          const statsData = await apiRequest<{ stats: { waiting: number; called: number; completed: number } }>(
            `/queue/live-stats?templeId=${temple._id}`
          );
          const occupancyPercent =
            temple.totalCapacity > 0 ? Math.round((temple.currentOccupancy / temple.totalCapacity) * 100) : 0;
          return {
            templeId: temple._id,
            templeName: temple.name,
            occupancyPercent,
            currentOccupancy: temple.currentOccupancy,
            totalCapacity: temple.totalCapacity,
            stats: statsData.stats,
          };
        })
      );

      setRows(statsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
    const interval = setInterval(() => {
      refreshDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async (templeId: string) => {
    try {
      setMessage("");
      setError("");
      const data = await apiRequest<{ queueEntry: { tokenNumber: number } }>("/queue/call-next", {
        method: "POST",
        body: JSON.stringify({ templeId }),
      });
      setMessage(`Called next token #${data.queueEntry.tokenNumber}`);
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to call next token");
    }
  };

  const handleMarkCompleted = async (templeId: string) => {
    try {
      setMessage("");
      setError("");
      const data = await apiRequest<{ queueEntry: { tokenNumber: number } }>("/queue/mark-completed", {
        method: "POST",
        body: JSON.stringify({ templeId }),
      });
      setMessage(`Marked token #${data.queueEntry.tokenNumber} as completed`);
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark token completed");
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-saffron-800">Admin Dashboard</h2>
          <span className="text-xs text-slate-500">{isRefreshing ? "Refreshing..." : "Auto-refresh: 30s"}</span>
        </div>
        <div className="rounded-lg border border-saffron-200 bg-saffron-50 p-3 text-sm">
          Prediction analytics are now available in the dedicated
          <Link className="ml-1 font-semibold text-saffron-700 underline" to="/predictions">
            Predictions Page
          </Link>
          .
        </div>
      </div>

      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <h3 className="mb-3 text-lg font-semibold text-saffron-700">Live Occupancy</h3>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.templeId} className="rounded-lg border border-saffron-100 p-3">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">{row.templeName}</span>
                <span>
                  {row.currentOccupancy}/{row.totalCapacity} ({row.occupancyPercent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-saffron-100">
                <div className="h-2 rounded-full bg-saffron-500" style={{ width: `${row.occupancyPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <h3 className="mb-3 text-lg font-semibold text-saffron-700">Queue Stats and Controls</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-saffron-50 text-left">
                <th className="border border-saffron-200 px-3 py-2">Temple</th>
                <th className="border border-saffron-200 px-3 py-2">Waiting</th>
                <th className="border border-saffron-200 px-3 py-2">Called</th>
                <th className="border border-saffron-200 px-3 py-2">Completed</th>
                <th className="border border-saffron-200 px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.templeId}>
                  <td className="border border-saffron-100 px-3 py-2 font-medium">{row.templeName}</td>
                  <td className="border border-saffron-100 px-3 py-2">{row.stats.waiting}</td>
                  <td className="border border-saffron-100 px-3 py-2">{row.stats.called}</td>
                  <td className="border border-saffron-100 px-3 py-2">{row.stats.completed}</td>
                  <td className="border border-saffron-100 px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCallNext(row.templeId)}
                        className="rounded-md bg-saffron-600 px-3 py-1.5 font-semibold text-white hover:bg-saffron-700"
                      >
                        Call Next Token
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(row.templeId)}
                        className="rounded-md border border-saffron-400 px-3 py-1.5 font-semibold text-saffron-800 hover:bg-saffron-100"
                      >
                        Mark Completed
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {message && <p className="rounded bg-emerald-50 p-3 text-emerald-700">{message}</p>}
      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
    </section>
  );
}

export default AdminDashboardPage;

