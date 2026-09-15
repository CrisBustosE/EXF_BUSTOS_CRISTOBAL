"use client";

import type { ReactNode } from "react";

type EntityModalProps = {
  show: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Modal genérico (título + contenido vía children), reutilizable para
 * Usuario/Producto/Cliente. Visibilidad 100% controlada por React (sin
 * la API JS de Bootstrap: el estado ya vive en el padre, no hace falta
 * sincronizar dos fuentes de verdad). */
export default function EntityModal({ show, title, onClose, children }: EntityModalProps) {
  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-modal-title"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="entity-modal-title">
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}
