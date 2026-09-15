"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import EntityModal from "@/components/EntityModal";
import Toast, { type ToastVariant } from "@/components/Toast";
import ProductoForm, { type ProductoFormValues } from "./ProductoForm";
import type { EstadoStock, ProductoRow } from "./types";

type ProductosViewProps = {
  productos: ProductoRow[];
  page: number;
  totalPages: number;
  searchField: "nombre" | "sku";
  searchValue: string;
  hasActiveFilter: boolean;
};

const clpFormatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

const ESTADO_BADGE: Record<EstadoStock, string> = {
  bajo: "text-bg-danger",
  normal: "text-bg-success",
  alto: "text-bg-info",
};

export default function ProductosView({
  productos,
  page,
  totalPages,
  searchField,
  searchValue,
  hasActiveFilter,
}: ProductosViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<ProductoRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingProducto, setDeletingProducto] = useState<ProductoRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ variant: ToastVariant; message: string } | null>(null);

  const [field, setFieldState] = useState<"nombre" | "sku">(searchField);
  const [query, setQuery] = useState(searchValue);

  function openCreate() {
    setEditingProducto(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(producto: ProductoRow) {
    setEditingProducto(producto);
    setFormError(null);
    setModalOpen(true);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set(field, query.trim());
    router.push(`/productos${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function handleSubmit(values: ProductoFormValues) {
    setFormError(null);
    const isEditing = editingProducto !== null;

    const body: Record<string, unknown> = {
      sku: values.sku,
      nombre: values.nombre,
      descripcion_corta: values.descripcion_corta,
      precio_neto: values.precio_neto,
      precio_de_venta: values.precio_de_venta,
      stock_actual: values.stock_actual,
      stock_minimo: values.stock_minimo,
      stock_bajo: values.stock_bajo,
      stock_alto: values.stock_alto,
    };
    if (values.descripcion_larga && values.descripcion_larga.trim()) {
      body.descripcion_larga = values.descripcion_larga.trim();
    }

    const res = await fetch(isEditing ? `/api/productos/${editingProducto.id}` : "/api/productos", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(typeof data.error === "string" ? data.error : "No se pudo guardar el producto");
      throw new Error("submit-failed");
    }

    setModalOpen(false);
    setToast({ variant: "success", message: isEditing ? "Producto actualizado" : "Producto creado" });
    router.refresh();
  }

  async function handleUploadImagen(file: File): Promise<{ imagenUrl: string } | { error: string }> {
    if (!editingProducto) return { error: "No se pudo subir la imagen" };

    const formData = new FormData();
    formData.append("imagen", file);

    const res = await fetch(`/api/productos/${editingProducto.id}/imagen`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { error: typeof data.error === "string" ? data.error : "No se pudo subir la imagen" };
    }

    router.refresh();
    return { imagenUrl: data.imagen_del_producto as string };
  }

  async function handleDelete() {
    if (!deletingProducto) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/productos/${deletingProducto.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setToast({ variant: "success", message: "Producto eliminado" });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({
          variant: "danger",
          message: typeof data.error === "string" ? data.error : "No se pudo eliminar el producto",
        });
      }
    } finally {
      setDeleteLoading(false);
      setDeletingProducto(null);
    }
  }

  return (
    <div>
      <h1 className="h3 fw-bold text-primary">Productos</h1>

      <div className="d-flex justify-content-between align-items-end mb-4 gap-3 flex-wrap">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Nuevo
        </button>

        <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
          <select
            className="form-select"
            value={field}
            onChange={(event) => setFieldState(event.target.value as "nombre" | "sku")}
            aria-label="Buscar por"
          >
            <option value="nombre">Nombre</option>
            <option value="sku">SKU</option>
          </select>
          <input
            type="search"
            className="form-control"
            placeholder={field === "nombre" ? "Buscar por nombre..." : "Buscar por SKU..."}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn-outline-secondary">
            <i className="bi bi-search" aria-hidden="true" />
          </button>
        </form>
      </div>

      {productos.length === 0 ? (
        <div className="text-center text-secondary py-5">
          <i className="bi bi-box-seam display-4 d-block mb-2 opacity-50" aria-hidden="true" />
          {hasActiveFilter ? "Sin resultados para tu búsqueda" : "No hay productos registrados"}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "14%" }}>SKU</th>
                  <th style={{ width: "28%" }}>Nombre</th>
                  <th style={{ width: "16%" }}>Precio de venta</th>
                  <th style={{ width: "12%" }}>Stock actual</th>
                  <th style={{ width: "12%" }}>Estado</th>
                  <th style={{ width: "18%" }} className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id}>
                    <td className="text-truncate">{producto.sku}</td>
                    <td className="text-truncate">{producto.nombre}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      {clpFormatter.format(producto.precio_de_venta)}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{producto.stock_actual}</td>
                    <td>
                      <span className={`badge ${ESTADO_BADGE[producto.estado_stock]}`}>
                        {producto.estado_stock}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => openEdit(producto)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeletingProducto(producto)}
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
            <nav aria-label="Paginación de productos">
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
        title={editingProducto ? "Editar producto" : "Nuevo producto"}
        onClose={() => setModalOpen(false)}
      >
        <ProductoForm
          producto={editingProducto}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          serverError={formError}
          onUploadImagen={editingProducto ? handleUploadImagen : undefined}
        />
      </EntityModal>

      <ConfirmDeleteModal
        show={deletingProducto !== null}
        entityLabel={deletingProducto ? `producto ${deletingProducto.nombre}` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProducto(null)}
        loading={deleteLoading}
      />

      {toast && <Toast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
