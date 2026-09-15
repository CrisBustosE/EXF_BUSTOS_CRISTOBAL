import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import UsuariosView from "./UsuariosView";
import type { UsuarioRow } from "./types";

const PAGE_SIZE = 20;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Server-to-server, sin CORS (STACK.md sección 3); la lista completa
  // se pagina acá porque GET /api/usuarios no soporta paginación server-side.
  const res = await fetch(`${process.env.API_URL}/api/usuarios`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");

  if (!res.ok) {
    return (
      <div className="alert alert-danger" role="alert">
        No se pudo cargar Usuarios (ventasfix-api respondió {res.status}).
      </div>
    );
  }

  const all = (await res.json()) as UsuarioRow[];
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);
  const page = Math.min(requestedPage, totalPages);
  const usuarios = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return <UsuariosView usuarios={usuarios} page={page} totalPages={totalPages} currentUserEmail={session.email} />;
}
