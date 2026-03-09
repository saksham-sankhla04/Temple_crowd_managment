import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiRequest } from "../lib/api";
import type { Temple } from "../types";

type QueueStatusResponse = {
  queueEntry: {
    tokenNumber: number;
    status: string;
    estimatedWaitMinutes: number;
    pilgrimName: string;
  };
  queuePosition: number;
  estimatedWaitMinutes: number;
};

function QueueStatusPage() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [checkForm, setCheckForm] = useState({ templeId: "", darshanSlot: "", tokenNumber: "" });
  const [result, setResult] = useState<QueueStatusResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest<{ temples: Temple[] }>("/temples")
      .then((data) => setTemples(data.temples))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load temples"));
  }, []);

  const selectedTempleForCheck = useMemo(
    () => temples.find((temple) => temple._id === checkForm.templeId),
    [temples, checkForm.templeId]
  );

  const handleCheckStatus = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const query = new URLSearchParams({
        templeId: checkForm.templeId,
        darshanSlot: checkForm.darshanSlot,
        tokenNumber: checkForm.tokenNumber,
      });
      const data = await apiRequest<QueueStatusResponse>(`/queue/status/by-token?${query.toString()}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch queue status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <h2 className="mb-2 text-2xl font-bold text-saffron-800">Queue Status</h2>
        <p className="mb-4 text-sm text-slate-600">
          Your queue token is auto-assigned during pass booking. Enter token details below to track position.
        </p>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCheckStatus}>
          <select
            className="rounded-md border border-saffron-300 px-3 py-2"
            value={checkForm.templeId}
            onChange={(e) => setCheckForm({ ...checkForm, templeId: e.target.value, darshanSlot: "" })}
            required
          >
            <option value="">Select Temple</option>
            {temples.map((temple) => (
              <option key={temple._id} value={temple._id}>
                {temple.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-saffron-300 px-3 py-2"
            value={checkForm.darshanSlot}
            onChange={(e) => setCheckForm({ ...checkForm, darshanSlot: e.target.value })}
            required
          >
            <option value="">Select Darshan Slot</option>
            {selectedTempleForCheck?.darshanTimings.map((slot) => (
              <option key={slot.slot} value={slot.slot}>
                {slot.slot}
              </option>
            ))}
          </select>

          <input
            className="rounded-md border border-saffron-300 px-3 py-2 md:col-span-2"
            type="number"
            min={1}
            placeholder="Token Number"
            value={checkForm.tokenNumber}
            onChange={(e) => setCheckForm({ ...checkForm, tokenNumber: e.target.value })}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 rounded-md bg-saffron-600 px-4 py-2 font-semibold text-white hover:bg-saffron-700 disabled:opacity-70"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </form>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {result && (
        <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
          <h3 className="text-lg font-bold text-saffron-800">Token #{result.queueEntry.tokenNumber}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-saffron-50 p-3">
              <p className="text-xs text-slate-500">Status</p>
              <p className="font-semibold uppercase">{result.queueEntry.status}</p>
            </div>
            <div className="rounded-lg bg-saffron-50 p-3">
              <p className="text-xs text-slate-500">Queue Position</p>
              <p className="font-semibold">{result.queuePosition}</p>
            </div>
            <div className="rounded-lg bg-saffron-50 p-3">
              <p className="text-xs text-slate-500">Estimated Wait</p>
              <p className="font-semibold">{result.estimatedWaitMinutes} min</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default QueueStatusPage;

