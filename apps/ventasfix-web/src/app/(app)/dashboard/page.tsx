import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

type DashboardCounts = {
  total_usuarios: number;
  total_productos: number;
  total_clientes: number;
};

const KPI_CARDS = [
  { key: "total_usuarios", label: "Usuarios", icon: "bi-people" },
  { key: "total_productos", label: "Productos", icon: "bi-box-seam" },
  { key: "total_clientes", label: "Clientes", icon: "bi-building" },
] as const;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Server-to-server: la API nunca es llamada desde el navegador (STACK.md
  // sección 3), así que no aplica CORS.
  const res = await fetch(`${process.env.API_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");

  if (!res.ok) {
    return (
      <div className="alert alert-danger" role="alert">
        No se pudo cargar el dashboard (ventasfix-api respondió {res.status}).
      </div>
    );
  }

  const counts = (await res.json()) as DashboardCounts;

  return (
    <div>
      <h1 className="h3 fw-bold mb-4 text-primary">Dashboard</h1>

      <div className="row g-3">
        {KPI_CARDS.map((card) => (
          <div className="col-12 col-sm-6 col-lg-4" key={card.key}>
            <div className="card shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <i className={`bi ${card.icon} fs-1 text-primary`} aria-hidden="true" />
                <div>
                  <div className="fs-2 fw-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {counts[card.key]}
                  </div>
                  <div className="text-secondary small">{card.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
