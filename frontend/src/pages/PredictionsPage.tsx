import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "../lib/api";
import type { Temple } from "../types";

type HourlyItem = {
  hour: string;
  timestamp: string;
  crowdScore: number;
  label: "Low" | "Moderate" | "High" | "Critical";
  predictedCrowd: number;
};

type PredictionResponse = {
  date: string;
  crowdScore: number;
  festivalName: string | null;
  peakHour: string;
  recommendation: string;
  hourlyBreakdown: HourlyItem[];
};

const todayString = new Date().toISOString().slice(0, 10);

function PredictionsPage() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [templeId, setTempleId] = useState("");
  const [date, setDate] = useState(todayString);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTemples = async () => {
      try {
        const data = await apiRequest<{ temples: Temple[] }>("/temples");
        setTemples(data.temples);
        if (data.temples.length > 0) {
          setTempleId(data.temples[0]._id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load temples");
      }
    };
    loadTemples();
  }, []);

  const fetchPrediction = async (selectedTempleId: string, selectedDate: string) => {
    if (!selectedTempleId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<PredictionResponse>(`/prediction/${selectedTempleId}?date=${selectedDate}`);
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prediction");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(templeId, date);
  }, [templeId, date]);

  const selectedTemple = useMemo(() => temples.find((t) => t._id === templeId), [temples, templeId]);

  const labelCounts = useMemo(() => {
    const counts = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    if (!prediction) return counts;
    prediction.hourlyBreakdown.forEach((item) => {
      counts[item.label] += 1;
    });
    return counts;
  }, [prediction]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <h2 className="text-2xl font-bold text-saffron-800">Crowd Predictions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Forecast temple crowd for any date using festival and day-pattern rules.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select
            className="rounded-md border border-saffron-300 px-3 py-2"
            value={templeId}
            onChange={(e) => setTempleId(e.target.value)}
          >
            {temples.map((temple) => (
              <option key={temple._id} value={temple._id}>
                {temple.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-saffron-300 px-3 py-2"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            type="button"
            onClick={() => fetchPrediction(templeId, date)}
            className="rounded-md bg-saffron-600 px-4 py-2 font-semibold text-white hover:bg-saffron-700"
          >
            Refresh Prediction
          </button>
        </div>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {loading && <p>Loading prediction...</p>}

      {prediction && (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-saffron-200 bg-white p-4 shadow-temple">
              <p className="text-xs uppercase text-slate-500">Temple</p>
              <p className="font-bold text-saffron-800">{selectedTemple?.name}</p>
            </div>
            <div className="rounded-xl border border-saffron-200 bg-white p-4 shadow-temple">
              <p className="text-xs uppercase text-slate-500">Crowd Score</p>
              <p className="text-xl font-bold text-saffron-800">{prediction.crowdScore}/100</p>
            </div>
            <div className="rounded-xl border border-saffron-200 bg-white p-4 shadow-temple">
              <p className="text-xs uppercase text-slate-500">Peak Hour</p>
              <p className="font-bold text-saffron-800">{prediction.peakHour}</p>
            </div>
            <div className="rounded-xl border border-saffron-200 bg-white p-4 shadow-temple">
              <p className="text-xs uppercase text-slate-500">Festival</p>
              <p className="font-bold text-saffron-800">{prediction.festivalName || "No major festival"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
            <p className="mb-3 text-sm font-semibold text-saffron-700">Recommendation</p>
            <p className="rounded-lg bg-saffron-50 p-3 text-sm text-slate-800">{prediction.recommendation}</p>
          </div>

          <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
            <h3 className="mb-3 text-lg font-semibold text-saffron-700">24-Hour Crowd Chart</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prediction.hourlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "predictedCrowd"
                        ? [`${String(value)} pilgrims`, "Predicted Crowd"]
                        : [String(value), String(name)]
                    }
                  />
                  <Line type="monotone" dataKey="predictedCrowd" stroke="#f17410" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
            <h3 className="mb-3 text-lg font-semibold text-saffron-700">Hourly Risk Mix</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(labelCounts).map(([label, count]) => (
                <div key={label} className="rounded-lg bg-saffron-50 p-3">
                  <p className="text-xs uppercase text-slate-500">{label}</p>
                  <p className="text-xl font-bold text-saffron-800">{count} hrs</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
            <h3 className="mb-3 text-lg font-semibold text-saffron-700">Hourly Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-saffron-50 text-left">
                    <th className="border border-saffron-200 px-3 py-2">Hour</th>
                    <th className="border border-saffron-200 px-3 py-2">Crowd Score</th>
                    <th className="border border-saffron-200 px-3 py-2">Predicted Crowd</th>
                    <th className="border border-saffron-200 px-3 py-2">Label</th>
                  </tr>
                </thead>
                <tbody>
                  {prediction.hourlyBreakdown.map((item) => (
                    <tr key={item.timestamp}>
                      <td className="border border-saffron-100 px-3 py-2">{item.hour}</td>
                      <td className="border border-saffron-100 px-3 py-2">{item.crowdScore}</td>
                      <td className="border border-saffron-100 px-3 py-2">{item.predictedCrowd}</td>
                      <td className="border border-saffron-100 px-3 py-2">{item.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default PredictionsPage;

