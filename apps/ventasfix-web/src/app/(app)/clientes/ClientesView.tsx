"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { redirectIfUnauthorized } from "@/lib/client-fetch";
import { useDebouncedEffect } from "@/lib/useDebouncedEffect";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import EntityModal from "@/components/EntityModal";
import Toast, { type ToastVariant } from "@/components/Toast";
import ClienteForm, { type ClienteFormValues } from "./ClienteForm";
import type { ClienteRow } from "./types";

type ClientesViewProps = {
  clientes: ClienteRow[];
  page: number;
  totalPages: number;
  searchField: "razon_social" | "rut_empresa";
  searchValue: string;
  hasActiveFilter: boolean;
};

export default function ClientesView({
  clientes,
  page,
  totalPages,
  searchField,
  searchValue,
  hasActiveFilter,
}: ClientesViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<ClienteRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ variant: ToastVariant; message: string } | null>(null);

  const [field, setFieldState] = useState<"razon_social" | "rut_empresa">(searchField);
  const [query, setQuery] = useState(searchValue);

  function openCreate() {
    setEditingCliente(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(cliente: ClienteRow) {
    setEditingCliente(cliente);
    setFormError(null);
    setModalOpen(true);
  }

  function pushSearch(nextField: "razon_social" | "rut_empresa", nextQuery: string) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set(nextField, nextQuery.trim());
    router.push(`/clientes${params.toString() ? `?${params.toString()}` : ""}`);
  }

  // Búsqueda dinámica: se dispara sola 350ms después de que la persona deja
  // de escribir (debounce), no en cada tecla. Vaciar el input también
  // dispara el efecto, así que limpia el query param y vuelve a listar todo.
  useDebouncedEffect(() => pushSearch(field, query), [field, query], 350);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushSearch(field, query);
  }

  async function handleSubmit(values: ClienteFormValues) {
    setFormError(null);
    const isEditing = editingCliente !== null;

    const res = await fetch(isEditing ? `/api/clientes/${editingCliente.id}` : "/api/clientes", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (redirectIfUnauthorized(res, router)) return;

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(typeof data.error === "string" ? data.error : "No se pudo guardar el cliente");
      throw new Error("submit-failed");
    }

    setModalOpen(false);
    setToast({ variant: "success", message: isEditing ? "Cliente actualizado" : "Cliente creado" });
    router.refresh();
  }

  async function handleDelete() {
    if (!deletingCliente) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clientes/${deletingCliente.id}`, { method: "DELETE" });
      if (redirectIfUnauthorized(res, router)) return;
      if (res.ok || res.status === 204) {
        setToast({ variant: "success", message: "Cliente eliminado" });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({
          variant: "danger",
          message: typeof data.error === "string" ? data.error : "No se pudo eliminar el cliente",
        });
      }
    } finally {
      setDeleteLoading(false);
      setDeletingCliente(null);
    }
  }

  return (
    <div>
      <h1 className="h3 fw-bold text-primary">Clientes</h1>

      <div className="d-flex justify-content-between align-items-end mb-4 gap-3 flex-wrap">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Nuevo
        </button>

        <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
          <select
            className="form-select"
            value={field}
            onChange={(event) => setFieldState(event.target.value as "razon_social" | "rut_empresa")}
            aria-label="Buscar por"
          >
            <option value="razon_social">Razón social</option>
            <option value="rut_empresa">RUT</option>
          </select>
          <input
            type="search"
            className="form-control"
            placeholder={field === "razon_social" ? "Buscar por razón social..." : "Buscar por RUT..."}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn-outline-secondary">
            <i className="bi bi-search" aria-hidden="true" />
          </button>
        </form>
      </div>

      {clientes.length === 0 ? (
        <div className="text-center text-secondary py-5">
          <i className="bi bi-building display-4 d-block mb-2 opacity-50" aria-hidden="true" />
          {hasActiveFilter ? "Sin resultados para tu búsqueda" : "No hay clientes registrados"}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>RUT empresa</th>
                  <th style={{ width: "30%" }}>Razón social</th>
                  <th style={{ width: "15%" }}>Rubro</th>
                  <th style={{ width: "25%" }}>Email de contacto</th>
                  <th style={{ width: "15%" }} className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="text-truncate">{cliente.rut_empresa}</td>
                    <td className="text-truncate">{cliente.razon_social}</td>
                    <td className="text-truncate">{cliente.rubro}</td>
                    <td className="text-truncate">{cliente.email_contacto}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => openEdit(cliente)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeletingCliente(cliente)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav aria-label="Paginación de clientes">
              <ul className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <li key={n} className={`page-item ${n === page ? "active" : ""}`}>
                    <a
                      className="page-link"
                      href={`?${new URLSearchParams({
                        ...(searchValue ? { [searchField]: searchValue } : {}),
                        page: String(n),
                      }).toString()}`}
                    >
                      {n}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      )}

      <EntityModal
        show={modalOpen}
        title={editingCliente ? "Editar cliente" : "Nuevo cliente"}
        onClose={() => setModalOpen(false)}
      >
        <ClienteForm
          cliente={editingCliente}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          serverError={formError}
        />
      </EntityModal>

      <ConfirmDeleteModal
        show={deletingCliente !== null}
        entityLabel={deletingCliente ? `cliente ${deletingCliente.razon_social}` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCliente(null)}
        loading={deleteLoading}
      />

      {toast && <Toast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
