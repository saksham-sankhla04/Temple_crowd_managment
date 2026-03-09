import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import type { Temple } from "../types";

function HomePage() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTemples = async () => {
      try {
        const data = await apiRequest<{ temples: Temple[] }>("/temples");
        setTemples(data.temples);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load temples");
      } finally {
        setLoading(false);
      }
    };
    loadTemples();
  }, []);

  return (
    <section>
      <h2 className="mb-2 text-2xl font-bold text-saffron-800">Select a Temple</h2>
      <p className="mb-5 text-slate-600">View live occupancy and darshan slots before planning your visit.</p>

      {loading && <p>Loading temples...</p>}
      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {temples.map((temple) => {
          const occupancyPercent = Math.round((temple.currentOccupancy / temple.totalCapacity) * 100);
          return (
            <Link
              key={temple._id}
              to={`/temples/${temple._id}`}
              className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple transition hover:-translate-y-0.5"
            >
              <h3 className="text-lg font-bold text-saffron-800">{temple.name}</h3>
              <p className="text-sm text-slate-600">{temple.location}</p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-700">
                  <span>Live occupancy</span>
                  <span>{occupancyPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-saffron-100">
                  <div className="h-2 rounded-full bg-saffron-500" style={{ width: `${occupancyPercent}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default HomePage;

