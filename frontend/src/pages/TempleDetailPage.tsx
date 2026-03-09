import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import type { Temple } from "../types";

function TempleDetailPage() {
  const { id } = useParams();
  const [temple, setTemple] = useState<Temple | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemple = async () => {
      if (!id) return;
      try {
        const data = await apiRequest<{ temple: Temple }>(`/temples/${id}`);
        setTemple(data.temple);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load temple");
      } finally {
        setLoading(false);
      }
    };
    loadTemple();
  }, [id]);

  const occupancyPercent = useMemo(() => {
    if (!temple || temple.totalCapacity === 0) return 0;
    return Math.round((temple.currentOccupancy / temple.totalCapacity) * 100);
  }, [temple]);

  if (loading) return <p>Loading temple details...</p>;
  if (error) return <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>;
  if (!temple) return <p>Temple not found</p>;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <h2 className="text-2xl font-bold text-saffron-800">{temple.name}</h2>
        <p className="text-slate-600">{temple.location}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-saffron-50 p-3">
            <p className="text-xs uppercase text-slate-500">Current Occupancy</p>
            <p className="text-xl font-bold text-saffron-800">
              {temple.currentOccupancy} / {temple.totalCapacity}
            </p>
          </div>
          <div className="rounded-lg bg-saffron-50 p-3">
            <p className="text-xs uppercase text-slate-500">Occupancy %</p>
            <p className="text-xl font-bold text-saffron-800">{occupancyPercent}%</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <h3 className="mb-3 text-lg font-bold text-saffron-800">Darshan Slots</h3>
        <div className="space-y-3">
          {temple.darshanTimings.map((slot) => {
            const percent = Math.round((slot.bookedCount / slot.maxPilgrims) * 100);
            return (
              <div key={slot.slot} className="rounded-lg border border-saffron-100 p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{slot.slot}</span>
                  <span>
                    {slot.bookedCount}/{slot.maxPilgrims}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-saffron-100">
                  <div className="h-2 rounded-full bg-saffron-500" style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default TempleDetailPage;

