type HealthOk = {
  status: "ok";
  db: "ok";
  timestamp: string;
};

type HealthResult =
  | { reachable: true; data: HealthOk }
  | { reachable: false; message: string };

async function getApiHealth(): Promise<HealthResult> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return { reachable: false, message: "API_URL no está configurada en .env.local" };
  }

  try {
    const res = await fetch(`${apiUrl}/api/health`, { cache: "no-store" });
    if (!res.ok) {
      return { reachable: false, message: `ventasfix-api respondió ${res.status}` };
    }
    return { reachable: true, data: (await res.json()) as HealthOk };
  } catch (error) {
    return {
      reachable: false,
      message: error instanceof Error ? error.message : "Error desconocido al contactar la API",
    };
  }
}

export default async function Home() {
  const health = await getApiHealth();

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0 fw-bold" style={{ color: "#1E3A5F" }}>
              VentasFix
            </h1>
            <form action="/api/logout" method="POST">
              <button type="submit" className="btn btn-outline-secondary btn-sm">
                Cerrar sesión
              </button>
            </form>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="h6 card-title text-secondary">Estado del stack</h2>

              <ul className="list-unstyled mb-3">
                <li className="d-flex justify-content-between border-bottom py-2">
                  <span>ventasfix-web</span>
                  <span className="badge text-bg-success">ok</span>
                </li>
                <li className="d-flex justify-content-between py-2">
                  <span>ventasfix-api</span>
                  {health.reachable ? (
                    <span className="badge text-bg-success">{health.data.status}</span>
                  ) : (
                    <span className="badge text-bg-danger">no disponible</span>
                  )}
                </li>
              </ul>

              {health.reachable ? (
                <p className="text-secondary small mb-0">
                  Base de datos: <strong>{health.data.db}</strong> · última verificación{" "}
                  {new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "medium" }).format(
                    new Date(health.data.timestamp),
                  )}
                </p>
              ) : (
                <div className="alert alert-danger mb-0" role="alert">
                  No se pudo contactar a ventasfix-api: {health.message}. Verifica que esté
                  corriendo (<code>npm run dev</code> en <code>apps/ventasfix-api</code>).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
