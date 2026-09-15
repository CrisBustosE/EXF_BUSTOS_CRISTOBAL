"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import type { ProductoRow } from "./types";

const requiredString = (label: string, maxLength?: number) => {
  let schema = z.string().trim().min(1, `${label} es requerido`);
  if (maxLength) {
    schema = schema.max(maxLength, `${label} no puede superar ${maxLength} caracteres`);
  }
  return schema;
};

// Los inputs son type="text" (no type="number"): un <input type="number">
// del navegador vacía su propio .value cuando el contenido no es un número
// válido (pegar "jjjj" deja value=""), así que la validación nunca podía
// distinguir "vacío" de "inválido" y siempre caía en "es requerido". Con
// texto plano, Zod ve el string real escrito y puede dar el mensaje correcto.
function numericString(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} es requerido`)
    .refine((val) => !Number.isNaN(Number(val)), `${label} debe ser un número válido`);
}

// Mismos techos que apps/ventasfix-api/src/lib/productos.ts: precio no
// tiene sentido de negocio arriba de 1 billón de CLP (y de paso queda
// bajo Number.MAX_SAFE_INTEGER); stock_* son Int en SQLite del lado de
// la API (overflow real ~2.147 millones, 500 crudo si no se valida
// antes) — un millón de unidades ya es un techo generoso.
const PRECIO_MAX = 1_000_000_000_000;
const STOCK_MAX = 1_000_000;

const positiveNumberField = (label: string) =>
  numericString(label)
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .positive(`${label} debe ser > 0`)
        .max(PRECIO_MAX, `${label} no puede superar ${PRECIO_MAX.toLocaleString("es-CL")}`),
    );

const nonNegativeIntField = (label: string) =>
  numericString(label)
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .int(`${label} debe ser un entero`)
        .nonnegative(`${label} debe ser >= 0`)
        .max(STOCK_MAX, `${label} no puede superar ${STOCK_MAX.toLocaleString("es-CL")}`),
    );

const schema = z.object({
  sku: requiredString("El sku", 50),
  nombre: requiredString("El nombre", 150),
  descripcion_corta: requiredString("La descripción corta", 200),
  descripcion_larga: z
    .string()
    .trim()
    .max(2000, "La descripción larga no puede superar 2000 caracteres")
    .optional(),
  precio_neto: positiveNumberField("El precio neto"),
  precio_de_venta: positiveNumberField("El precio de venta"),
  stock_actual: nonNegativeIntField("El stock actual"),
  stock_minimo: nonNegativeIntField("El stock mínimo"),
  stock_bajo: nonNegativeIntField("El stock bajo"),
  stock_alto: nonNegativeIntField("El stock alto"),
});

export type ProductoFormValues = z.infer<typeof schema>;

type UploadResult = { imagenUrl: string } | { error: string };

type ProductoFormProps = {
  producto: ProductoRow | null;
  onSubmit: (values: ProductoFormValues) => Promise<void>;
  onCancel: () => void;
  serverError?: string | null;
  onUploadImagen?: (file: File) => Promise<UploadResult>;
};

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function ProductoForm({
  producto,
  onSubmit,
  onCancel,
  serverError,
  onUploadImagen,
}: ProductoFormProps) {
  const [values, setValues] = useState({
    sku: producto?.sku ?? "",
    nombre: producto?.nombre ?? "",
    descripcion_corta: producto?.descripcion_corta ?? "",
    descripcion_larga: producto?.descripcion_larga ?? "",
    precio_neto: producto ? String(producto.precio_neto) : "",
    precio_de_venta: producto ? String(producto.precio_de_venta) : "",
    stock_actual: producto ? String(producto.stock_actual) : "",
    stock_minimo: producto ? String(producto.stock_minimo) : "",
    stock_bajo: producto ? String(producto.stock_bajo) : "",
    stock_alto: producto ? String(producto.stock_alto) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [currentImagen, setCurrentImagen] = useState(producto?.imagen_del_producto ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imagenError, setImagenError] = useState<string | null>(null);
  const [imagenLoading, setImagenLoading] = useState(false);

  function setField(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  // Primera línea de defensa en los 6 campos numéricos: bloquea letras al
  // tipear/pegar. No reemplaza la validación Zod del submit (deja pasar
  // estados intermedios como "-", "3." mientras se escribe), solo evita
  // que el usuario meta texto que de entrada no puede ser un número.
  function setNumericField(field: keyof typeof values, value: string) {
    if (value !== "" && !/^-?\d*\.?\d*$/.test(value)) return;
    setField(field, value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await onSubmit(parsed.data);
    } catch {
      // el padre ya expone el error de servidor vía `serverError`
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImagenError(null);
    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleUploadImagen() {
    if (!selectedFile || !onUploadImagen) return;
    setImagenLoading(true);
    setImagenError(null);
    try {
      const result = await onUploadImagen(selectedFile);
      if ("error" in result) {
        setImagenError(result.error);
        return;
      }
      setCurrentImagen(result.imagenUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
    } finally {
      setImagenLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="alert alert-danger py-2" role="alert">
          {serverError}
        </div>
      )}

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.sku ? "is-invalid" : ""}`}
          id="producto-sku"
          placeholder="SKU"
          value={values.sku}
          onChange={(e) => setField("sku", e.target.value)}
        />
        <label htmlFor="producto-sku">SKU</label>
        {errors.sku && <div className="invalid-feedback">{errors.sku}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
          id="producto-nombre"
          placeholder="Nombre"
          value={values.nombre}
          onChange={(e) => setField("nombre", e.target.value)}
        />
        <label htmlFor="producto-nombre">Nombre</label>
        {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.descripcion_corta ? "is-invalid" : ""}`}
          id="producto-descripcion-corta"
          placeholder="Descripción corta"
          value={values.descripcion_corta}
          onChange={(e) => setField("descripcion_corta", e.target.value)}
        />
        <label htmlFor="producto-descripcion-corta">Descripción corta</label>
        {errors.descripcion_corta && <div className="invalid-feedback">{errors.descripcion_corta}</div>}
      </div>

      <div className="form-floating mb-3">
        <textarea
          className="form-control"
          id="producto-descripcion-larga"
          placeholder="Descripción larga"
          style={{ height: 100 }}
          value={values.descripcion_larga}
          onChange={(e) => setField("descripcion_larga", e.target.value)}
        />
        <label htmlFor="producto-descripcion-larga">Descripción larga (opcional)</label>
      </div>

      <div className="row">
        <div className="col-6">
          <div className="form-floating mb-3">
            <input
              type="text"
              inputMode="decimal"
              className={`form-control ${errors.precio_neto ? "is-invalid" : ""}`}
              id="producto-precio-neto"
              placeholder="Precio neto"
              value={values.precio_neto}
              onChange={(e) => setNumericField("precio_neto", e.target.value)}
            />
            <label htmlFor="producto-precio-neto">Precio neto</label>
            {errors.precio_neto && <div className="invalid-feedback">{errors.precio_neto}</div>}
          </div>
        </div>
        <div className="col-6">
          <div className="form-floating mb-3">
            <input
              type="text"
              inputMode="decimal"
              className={`form-control ${errors.precio_de_venta ? "is-invalid" : ""}`}
              id="producto-precio-venta"
              placeholder="Precio de venta"
              value={values.precio_de_venta}
              onChange={(e) => setNumericField("precio_de_venta", e.target.value)}
            />
            <label htmlFor="producto-precio-venta">Precio de venta</label>
            {errors.precio_de_venta && <div className="invalid-feedback">{errors.precio_de_venta}</div>}
          </div>
        </div>
      </div>

      <div className="row">
        {(
          [
            ["stock_actual", "Stock actual"],
            ["stock_minimo", "Stock mínimo"],
            ["stock_bajo", "Stock bajo"],
            ["stock_alto", "Stock alto"],
          ] as const
        ).map(([field, label]) => (
          <div className="col-6" key={field}>
            <div className="form-floating mb-3">
              <input
                type="text"
                inputMode="numeric"
                className={`form-control ${errors[field] ? "is-invalid" : ""}`}
                id={`producto-${field}`}
                placeholder={label}
                value={values[field]}
                onChange={(e) => setNumericField(field, e.target.value)}
              />
              <label htmlFor={`producto-${field}`}>{label}</label>
              {errors[field] && <div className="invalid-feedback">{errors[field]}</div>}
            </div>
          </div>
        ))}
      </div>

      {(() => {
        const stockBajoNum = Number(values.stock_bajo);
        const stockAltoNum = Number(values.stock_alto);
        const overlap =
          values.stock_bajo !== "" &&
          values.stock_alto !== "" &&
          !Number.isNaN(stockBajoNum) &&
          !Number.isNaN(stockAltoNum) &&
          stockBajoNum >= stockAltoNum;
        if (!overlap) return null;
        return (
          <div className="alert alert-warning py-2 small mb-3" role="alert">
            Stock bajo ({stockBajoNum}) es mayor o igual que stock alto ({stockAltoNum}): el
            producto quedará marcado como &quot;bajo&quot; siempre. Es válido, pero
            probablemente no es la configuración deseada.
          </div>
        );
      })()}

      {producto && (
        <div className="mb-3 border rounded p-3">
          <label className="form-label d-block fw-semibold">Imagen del producto</label>

          {(previewUrl ?? currentImagen) && (
            <img
              src={previewUrl ?? `${API_ORIGIN}${currentImagen}`}
              alt="Imagen del producto"
              className="img-thumbnail mb-2 d-block"
              style={{ maxWidth: 160 }}
            />
          )}

          <input
            type="file"
            className="form-control mb-2"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />

          {imagenError && (
            <div className="alert alert-danger py-2 mb-2" role="alert">
              {imagenError}
            </div>
          )}

          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={!selectedFile || imagenLoading}
            onClick={handleUploadImagen}
          >
            {imagenLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              "Subir imagen"
            )}
          </button>
        </div>
      )}

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          ) : (
            "Guardar"
          )}
        </button>
      </div>
    </form>
  );
}
