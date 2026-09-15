"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redirectIfUnauthorized } from "@/lib/client-fetch";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import EntityModal from "@/components/EntityModal";
import Toast, { type ToastVariant } from "@/components/Toast";
import UsuarioForm, { type UsuarioFormValues } from "./UsuarioForm";
import type { UsuarioRow } from "./types";

type UsuariosViewProps = {
  usuarios: UsuarioRow[];
  page: number;
  totalPages: number;
  currentUserEmail: string;
};

export default function UsuariosView({ usuarios, page, totalPages, currentUserEmail }: UsuariosViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<UsuarioRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ variant: ToastVariant; message: string } | null>(null);

  function openCreate() {
    setEditingUsuario(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(usuario: UsuarioRow) {
    setEditingUsuario(usuario);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(values: UsuarioFormValues) {
    setFormError(null);
    const isEditing = editingUsuario !== null;

    const body: Record<string, string> = {
      rut: values.rut,
      nombre: values.nombre,
      apellido: values.apellido,
      email: values.email,
    };
    if (!isEditing || values.password) {
      body.password = values.password;
    }

    const res = await fetch(isEditing ? `/api/usuarios/${editingUsuario.id}` : "/api/usuarios", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (redirectIfUnauthorized(res, router)) return;

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(typeof data.error === "string" ? data.error : "No se pudo guardar el usuario");
      throw new Error("submit-failed");
    }

    setModalOpen(false);
    setToast({ variant: "success", message: isEditing ? "Usuario actualizado" : "Usuario creado" });
    router.refresh();
  }

  async function handleDelete() {
    if (!deletingUsuario) return;
    const isSelf = deletingUsuario.email === currentUserEmail;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/usuarios/${deletingUsuario.id}`, { method: "DELETE" });
      if (redirectIfUnauthorized(res, router)) return;
      if (res.ok || res.status === 204) {
        if (isSelf) {
          // El DELETE ya se confirmó (204) antes de tocar la sesión: si
          // hubiera fallado (ej. 409 por condición de carrera con el
          // último usuario), este bloque nunca se ejecuta y la sesión
          // sigue intacta.
          await fetch("/api/logout", { method: "POST" });
          router.push("/login");
          return;
        }
        setToast({ variant: "success", message: "Usuario eliminado" });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({
          variant: "danger",
          message: typeof data.error === "string" ? data.error : "No se pudo eliminar el usuario",
        });
      }
    } finally {
      setDeleteLoading(false);
      setDeletingUsuario(null);
    }
  }

  return (
    <div>
      <h1 className="h3 fw-bold text-primary">Usuarios</h1>
      <div className="mb-4">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Nuevo
        </button>
      </div>

      {usuarios.length === 0 ? (
        <div className="text-center text-secondary py-5">
          <i className="bi bi-people display-4 d-block mb-2 opacity-50" aria-hidden="true" />
          No hay usuarios registrados
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.rut}</td>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.apellido}</td>
                    <td>{usuario.email}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => openEdit(usuario)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeletingUsuario(usuario)}
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
            <nav aria-label="Paginación de usuarios">
              <ul className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <li key={n} className={`page-item ${n === page ? "active" : ""}`}>
                    <a className="page-link" href={`?page=${n}`}>
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
        title={editingUsuario ? "Editar usuario" : "Nuevo usuario"}
        onClose={() => setModalOpen(false)}
      >
        <UsuarioForm
          usuario={editingUsuario}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          serverError={formError}
        />
      </EntityModal>

      <ConfirmDeleteModal
        show={deletingUsuario !== null}
        entityLabel={deletingUsuario ? `usuario ${deletingUsuario.nombre} ${deletingUsuario.apellido}` : ""}
        message={
          deletingUsuario && deletingUsuario.email === currentUserEmail
            ? `¿Eliminar tu propio usuario (${deletingUsuario.nombre} ${deletingUsuario.apellido})? Se cerrará tu sesión inmediatamente.`
            : undefined
        }
        onConfirm={handleDelete}
        onCancel={() => setDeletingUsuario(null)}
        loading={deleteLoading}
      />

      {toast && <Toast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
