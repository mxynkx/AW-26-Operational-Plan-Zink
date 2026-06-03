import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (login(username.trim(), password)) {
      setError("");
      return;
    }
    setError("Invalid username or password.");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-surface-border rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/datahat-logo.png" alt="Data-Hat" className="h-14 w-auto mb-4 object-contain" />
          <h1 className="text-headline-md font-bold text-primary">AW26 Operational Plan</h1>
          <p className="text-body-md text-secondary mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label-caps text-secondary block mb-1">Username</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-surface-border rounded px-3 py-2 text-body-md bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>
          <div>
            <label className="text-label-caps text-secondary block mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-surface-border rounded px-3 py-2 text-body-md bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>
          {error ? <p className="text-error text-body-md">{error}</p> : null}
          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-2.5 rounded text-label-caps hover:bg-on-primary-fixed-variant transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
