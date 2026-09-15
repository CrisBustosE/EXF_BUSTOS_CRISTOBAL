import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ClientesView from "./ClientesView";
import type { ClienteRow } from "./types";

const PAGE_SIZE = 20;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; razon_social?: string; rut_empresa?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { page: pageParam, razon_social, rut_empresa } = await searchParams;

  const apiQuery = new URLSearchParams();
  if (razon_social) apiQuery.set("razon_social", razon_social);
  if (rut_empresa) apiQuery.set("rut_empresa", rut_empresa);
  const qs = apiQuery.toString();

  // Server-to-server, sin CORS (STACK.md sección 3); la lista completa
  // se pagina acá porque GET /api/clientes no soporta paginación server-side.
  const res = await fetch(`${process.env.API_URL}/api/clientes${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");

  if (!res.ok) {
    return (
      <div className="alert alert-danger" role="alert">
        No se pudo cargar Clientes (ventasfix-api respondió {res.status}).
      </div>
    );
  }

  const all = (await res.json()) as ClienteRow[];
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const requestedPage = Math.max(1, Number(pageParam) || 1);
  const page = Math.min(requestedPage, totalPages);
  const clientes = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ClientesView
      clientes={clientes}
      page={page}
      totalPages={totalPages}
      searchField={rut_empresa ? "rut_empresa" : "razon_social"}
      searchValue={rut_empresa ?? razon_social ?? ""}
      hasActiveFilter={Boolean(razon_social || rut_empresa)}
    />
  );
}
