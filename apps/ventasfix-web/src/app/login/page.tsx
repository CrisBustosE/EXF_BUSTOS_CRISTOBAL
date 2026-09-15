"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "No se pudo iniciar sesión");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo contactar el servidor");
      setLoading(false);
    }
  }

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary">
      <div className="card shadow-sm" style={{ width: "100%", maxWidth: 380 }}>
        <div className="card-body p-4">
          <h1 className="h4 text-center fw-bold mb-4" style={{ color: "#1E3A5F" }}>
            VentasFix
          </h1>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate={false}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="nombre@ventasfix.cl"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <label htmlFor="email">Email</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <label htmlFor="password">Password</label>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
