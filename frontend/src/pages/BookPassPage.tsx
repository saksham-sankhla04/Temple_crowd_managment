import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiRequest } from "../lib/api";
import type { Temple } from "../types";

type PassResponse = {
  pass: {
    passCode: string;
    qrData: string;
    status: string;
    templeId: string;
    darshanSlot: string;
    pilgrimName: string;
  };
  queue: {
    tokenNumber: number;
    queuePosition: number;
    estimatedWaitMinutes: number;
    status: string;
  };
  message: string;
};

function BookPassPage() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [form, setForm] = useState({
    templeId: "",
    pilgrimName: "",
    phone: "",
    numPilgrims: 1,
    darshanSlot: "",
    visitDate: "",
  });
  const [result, setResult] = useState<PassResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<{ temples: Temple[] }>("/temples")
      .then((data) => setTemples(data.temples))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load temples"));
  }, []);

  const selectedTemple = useMemo(
    () => temples.find((temple) => temple._id === form.templeId),
    [temples, form.templeId]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResult(null);
    try {
      const data = await apiRequest<PassResponse>("/passes/book", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setResult(data);
      setMessage("Pass booked and queue token assigned successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book pass");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <h2 className="mb-4 text-2xl font-bold text-saffron-800">Book Darshan Pass</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <select
            className="rounded-md border border-saffron-300 px-3 py-2"
            value={form.templeId}
            onChange={(e) => setForm({ ...form, templeId: e.target.value, darshanSlot: "" })}
            required
          >
            <option value="">Select Temple</option>
            {temples.map((temple) => (
              <option key={temple._id} value={temple._id}>
                {temple.name}
              </option>
            ))}
          </select>

          <input
            className="rounded-md border border-saffron-300 px-3 py-2"
            placeholder="Pilgrim Name"
            value={form.pilgrimName}
            onChange={(e) => setForm({ ...form, pilgrimName: e.target.value })}
            required
          />

          <input
            className="rounded-md border border-saffron-300 px-3 py-2"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />

          <input
            className="rounded-md border border-saffron-300 px-3 py-2"
            type="number"
            min={1}
            max={10}
            value={form.numPilgrims}
            onChange={(e) => setForm({ ...form, numPilgrims: Number(e.target.value) })}
            required
          />

          <input
            className="rounded-md border border-saffron-300 px-3 py-2"
            type="date"
            value={form.visitDate}
            onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
            required
          />

          <select
            className="rounded-md border border-saffron-300 px-3 py-2 md:col-span-2"
            value={form.darshanSlot}
            onChange={(e) => setForm({ ...form, darshanSlot: e.target.value })}
            required
          >
            <option value="">Select Darshan Slot</option>
            {selectedTemple?.darshanTimings.map((slot) => (
              <option key={slot.slot} value={slot.slot}>
                {slot.slot} ({slot.bookedCount}/{slot.maxPilgrims} booked)
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 rounded-md bg-saffron-600 px-4 py-2 font-semibold text-white hover:bg-saffron-700 disabled:opacity-70"
          >
            {loading ? "Booking..." : "Book Pass"}
          </button>
        </form>
      </div>

      {message && <p className="rounded bg-emerald-50 p-3 text-emerald-700">{message}</p>}
      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {result?.pass && (
        <div className="rounded-2xl border border-saffron-200 bg-white p-5 text-center shadow-temple">
          <p className="text-sm text-slate-600">Pass Code</p>
          <p className="text-xl font-bold text-saffron-800">{result.pass.passCode}</p>
          <img src={result.pass.qrData} alt="Darshan pass QR code" className="mx-auto mt-4 w-56 rounded-lg border" />
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-lg bg-saffron-50 p-3 text-left text-sm">
            <p>
              <span className="font-semibold">Queue Token:</span> #{result.queue.tokenNumber}
            </p>
            <p>
              <span className="font-semibold">Assigned Position:</span> {result.queue.queuePosition}
            </p>
            <p>
              <span className="font-semibold">Estimated Wait:</span> {result.queue.estimatedWaitMinutes} min
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default BookPassPage;
