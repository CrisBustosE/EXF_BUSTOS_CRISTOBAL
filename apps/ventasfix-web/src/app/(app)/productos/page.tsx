import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ProductosView from "./ProductosView";
import type { ProductoRow } from "./types";

const PAGE_SIZE = 20;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; nombre?: string; sku?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { page: pageParam, nombre, sku } = await searchParams;

  const apiQuery = new URLSearchParams();
  if (nombre) apiQuery.set("nombre", nombre);
  if (sku) apiQuery.set("sku", sku);
  const qs = apiQuery.toString();

  // Server-to-server, sin CORS (STACK.md sección 3); la lista completa
  // se pagina acá porque GET /api/productos no soporta paginación server-side.
  const res = await fetch(`${process.env.API_URL}/api/productos${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");

  if (!res.ok) {
    return (
      <div className="alert alert-danger" role="alert">
        No se pudo cargar Productos (ventasfix-api respondió {res.status}).
      </div>
    );
  }

  const all = (await res.json()) as ProductoRow[];
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const requestedPage = Math.max(1, Number(pageParam) || 1);
  const page = Math.min(requestedPage, totalPages);
  const productos = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <ProductosView
      productos={productos}
      page={page}
      totalPages={totalPages}
      searchField={sku ? "sku" : "nombre"}
      searchValue={sku ?? nombre ?? ""}
      hasActiveFilter={Boolean(nombre || sku)}
    />
  );
}
