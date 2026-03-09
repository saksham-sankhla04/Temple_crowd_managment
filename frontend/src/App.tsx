import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import TempleDetailPage from "./pages/TempleDetailPage";
import BookPassPage from "./pages/BookPassPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import PredictionsPage from "./pages/PredictionsPage";
import { apiRequest, clearSession, getSavedToken, getSavedUser, saveToken, saveUser } from "./lib/api";

type AuthMode = "login" | "register";

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "staff" | "pilgrim";
  };
  message: string;
};

const navItems = [
  { path: "/", label: "Home" },
  { path: "/book-pass", label: "Book Pass" },
  { path: "/my-bookings", label: "My Bookings" },
  { path: "/predictions", label: "Predictions" },
  { path: "/admin", label: "Admin Dashboard" },
];

function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = getSavedToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const token = getSavedToken();
  const user = getSavedUser();
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }
  if (user.role !== "admin" && user.role !== "staff") {
    return <div className="rounded-lg bg-red-50 p-4 text-red-700">Admin/Staff access required.</div>;
  }
  return children;
}

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authTick, setAuthTick] = useState(0);

  const currentUser = useMemo(() => getSavedUser(), [authTick]);

  const handleAuth = async () => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : { name: authForm.name, email: authForm.email, password: authForm.password };

      const data = await apiRequest<AuthResponse>(endpoint, {
        method: "POST",
        headers: {},
        body: JSON.stringify(payload),
      });
      saveToken(data.token);
      saveUser(data.user);
      setShowAuthPanel(false);
      setAuthForm({ name: "", email: "", password: "" });
      setAuthTick((v) => v + 1);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setAuthTick((v) => v + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-saffron-50 via-white to-saffron-100 text-slate-900">
      <header className="border-b border-saffron-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-saffron-800">Gujarat Pilgrimage Crowd Management</h1>
            <p className="text-xs text-slate-600">Somnath | Dwarka | Ambaji | Pavagadh</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-full border border-saffron-300 bg-white px-4 py-1.5 text-sm font-medium text-saffron-700 transition hover:bg-saffron-100"
              >
                {item.label}
              </Link>
            ))}
            {currentUser ? (
              <>
                <span className="rounded-full bg-saffron-100 px-3 py-1 text-xs font-semibold text-saffron-800">
                  {currentUser.name} ({currentUser.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-saffron-300 bg-white px-4 py-1.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthPanel(true)}
                className="rounded-full bg-saffron-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-saffron-700"
              >
                Login / Register
              </button>
            )}
          </nav>
        </div>
      </header>

      {showAuthPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl border border-saffron-200 bg-white p-5 shadow-temple">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-saffron-800">
                {authMode === "login" ? "Login" : "Register"}
              </h2>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => setShowAuthPanel(false)}>
                Close
              </button>
            </div>
            <div className="space-y-3">
              {authMode === "register" && (
                <input
                  className="w-full rounded-md border border-saffron-300 px-3 py-2"
                  placeholder="Name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                />
              )}
              <input
                className="w-full rounded-md border border-saffron-300 px-3 py-2"
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
              <input
                className="w-full rounded-md border border-saffron-300 px-3 py-2"
                placeholder="Password"
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
              <button
                disabled={authBusy}
                onClick={handleAuth}
                className="w-full rounded-md bg-saffron-600 px-4 py-2 font-semibold text-white hover:bg-saffron-700 disabled:opacity-70"
              >
                {authBusy ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"}
              </button>
              <button
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                className="w-full rounded-md border border-saffron-300 px-4 py-2 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
              >
                {authMode === "login" ? "Need an account? Register" : "Have an account? Login"}
              </button>
              {authError && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{authError}</p>}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/temples/:id" element={<TempleDetailPage />} />
          <Route
            path="/book-pass"
            element={
              <ProtectedRoute>
                <BookPassPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/predictions"
            element={
              <ProtectedRoute>
                <PredictionsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
