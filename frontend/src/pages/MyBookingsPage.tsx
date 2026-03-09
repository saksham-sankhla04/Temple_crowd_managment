import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type PassItem = {
  _id: string;
  passCode: string;
  pilgrimName: string;
  numPilgrims: number;
  darshanSlot: string;
  visitDate: string;
  qrData: string;
  status: "booked" | "used" | "cancelled";
  templeId?: {
    name: string;
    location: string;
  };
  queue?: {
    tokenNumber: number;
    status: string;
    estimatedWaitMinutes: number;
    queuePosition: number;
    darshanSlot: string;
  } | null;
  tokenNumber?: number;
  createdAt: string;
};

function MyBookingsPage() {
  const [passes, setPasses] = useState<PassItem[]>([]);
  const [selectedQr, setSelectedQr] = useState<PassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPasses = async () => {
      try {
        const data = await apiRequest<{ passes: PassItem[] }>("/passes/mine");
        setPasses(data.passes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    loadPasses();
  }, []);

  const visiblePasses = passes.filter((pass) => pass.status !== "used");

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
        <h2 className="text-2xl font-bold text-saffron-800">My Bookings</h2>
        <p className="mt-1 text-sm text-slate-600">View all your booked passes and retrieve QR anytime.</p>
      </div>

      {loading && <p>Loading your bookings...</p>}
      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {!loading && !error && visiblePasses.length === 0 && (
        <p className="rounded bg-white p-4 text-slate-700 shadow-temple">No bookings found for your account.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {visiblePasses.map((pass) => (
          <div key={pass._id} className="rounded-2xl border border-saffron-200 bg-white p-5 shadow-temple">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500">Pass Code</p>
                <p className="text-lg font-bold text-saffron-800">{pass.passCode}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  pass.status === "booked"
                    ? "bg-emerald-100 text-emerald-800"
                    : pass.status === "used"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {pass.status}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Temple:</span> {pass.templeId?.name || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Location:</span> {pass.templeId?.location || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Slot:</span> {pass.darshanSlot}
              </p>
              <p>
                <span className="font-semibold">Visit Date:</span>{" "}
                {new Date(pass.visitDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
              <p>
                <span className="font-semibold">Pilgrims:</span> {pass.numPilgrims}
              </p>
              {pass.queue && (
                <>
                  <p>
                    <span className="font-semibold">Queue Token:</span> #{pass.queue.tokenNumber}
                  </p>
                  <p>
                    <span className="font-semibold">Queue Position:</span> {pass.queue.queuePosition}
                  </p>
                  <p>
                    <span className="font-semibold">Est. Wait:</span> {pass.queue.estimatedWaitMinutes} min
                  </p>
                </>
              )}
              {!pass.queue && pass.tokenNumber && (
                <p>
                  <span className="font-semibold">Queue Token:</span> #{pass.tokenNumber}
                </p>
              )}
              {!pass.queue && (
                <p className="rounded bg-amber-50 px-2 py-1 text-amber-800">
                  Queue token not assigned for this older booking. Book again to get instant queue assignment.
                </p>
              )}
            </div>

            <button
              type="button"
              className="mt-4 rounded-md bg-saffron-600 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
              onClick={() => setSelectedQr(pass)}
            >
              View QR
            </button>
          </div>
        ))}
      </div>

      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-saffron-200 bg-white p-5 text-center shadow-temple">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-saffron-800">{selectedQr.passCode}</h3>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => setSelectedQr(null)}>
                Close
              </button>
            </div>
            <img
              src={selectedQr.qrData}
              alt={`QR for ${selectedQr.passCode}`}
              className="mx-auto w-64 rounded-lg border border-saffron-200"
            />
            <p className="mt-3 text-sm text-slate-700">
              {selectedQr.templeId?.name} | {selectedQr.darshanSlot}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default MyBookingsPage;
