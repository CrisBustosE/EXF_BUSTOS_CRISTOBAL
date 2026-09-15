"use client";

import { useEffect } from "react";

export type ToastVariant = "success" | "danger";

type ToastProps = {
  variant: ToastVariant;
  message: string;
  onClose: () => void;
};

/** Toast arriba a la derecha, auto-dismiss ~4s (BRAND.md sección 8).
 * Reutilizable para Usuario/Producto/Cliente. */
export default function Toast({ variant, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
      <div className={`toast show text-bg-${variant}`} role="alert" aria-live="assertive" aria-atomic="true">
        <div className="d-flex">
          <div className="toast-body">{message}</div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            aria-label="Cerrar"
            onClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}
