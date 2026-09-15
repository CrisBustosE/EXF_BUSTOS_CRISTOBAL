"use client";

type ConfirmDeleteModalProps = {
  show: boolean;
  /** ej. "usuario Juan Pérez" — BRAND.md sección 7: "¿Eliminar [entidad]?..." */
  entityLabel: string;
  /** Reemplaza el texto templado por completo (ej. advertencia de auto-eliminación). */
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

/** Modal de confirmación de eliminación, reutilizable para Usuario/
 * Producto/Cliente (BRAND.md sección 5: "destructivo = outline rojo con
 * confirmación (modal)"). */
export default function ConfirmDeleteModal({
  show,
  entityLabel,
  message,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteModalProps) {
  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="confirm-delete-title">
                Confirmar eliminación
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCancel} />
            </div>
            <div className="modal-body">
              <p className="mb-0">{message ?? `¿Eliminar ${entityLabel}? Esta acción no se puede deshacer.`}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onCancel} />
    </>
  );
}
