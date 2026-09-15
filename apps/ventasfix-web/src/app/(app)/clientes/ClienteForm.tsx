"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { isValidRut } from "@/lib/rut";
import type { ClienteRow } from "./types";

const rutEmpresaField = z
  .string()
  .trim()
  .min(1, "El rut_empresa es requerido")
  .max(12, "El rut_empresa no puede superar 12 caracteres")
  .refine(isValidRut, "RUT inválido (dígito verificador no coincide)");

const emailContactoField = z
  .string()
  .trim()
  .min(1, "El email de contacto es requerido")
  .max(150, "El email de contacto no puede superar 150 caracteres")
  .email("Email inválido");

export type ClienteFormValues = {
  rut_empresa: string;
  rubro: string;
  razon_social: string;
  telefono: string;
  direccion: string;
  nombre_contacto: string;
  email_contacto: string;
};

type ClienteFormProps = {
  /** null = crear; un cliente existente = editar (formulario no decide el verbo HTTP). */
  cliente: ClienteRow | null;
  onSubmit: (values: ClienteFormValues) => Promise<void>;
  onCancel: () => void;
  serverError?: string | null;
};

const schema = z.object({
  rut_empresa: rutEmpresaField,
  rubro: z.string().trim().min(1, "El rubro es requerido").max(100, "El rubro no puede superar 100 caracteres"),
  razon_social: z
    .string()
    .trim()
    .min(1, "La razón social es requerida")
    .max(150, "La razón social no puede superar 150 caracteres"),
  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono es requerido")
    .min(6, "El teléfono debe tener entre 6 y 20 caracteres")
    .max(20, "El teléfono debe tener entre 6 y 20 caracteres")
    .regex(
      /^\+?[\d\s()-]+$/,
      "El teléfono solo puede contener números, espacios, guiones, paréntesis y un + inicial",
    ),
  direccion: z
    .string()
    .trim()
    .min(1, "La dirección es requerida")
    .max(200, "La dirección no puede superar 200 caracteres"),
  nombre_contacto: z
    .string()
    .trim()
    .min(1, "El nombre de contacto es requerido")
    .max(100, "El nombre de contacto no puede superar 100 caracteres"),
  email_contacto: emailContactoField,
});

export default function ClienteForm({ cliente, onSubmit, onCancel, serverError }: ClienteFormProps) {
  const [rutEmpresa, setRutEmpresa] = useState(cliente?.rut_empresa ?? "");
  const [rubro, setRubro] = useState(cliente?.rubro ?? "");
  const [razonSocial, setRazonSocial] = useState(cliente?.razon_social ?? "");
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "");
  const [direccion, setDireccion] = useState(cliente?.direccion ?? "");
  const [nombreContacto, setNombreContacto] = useState(cliente?.nombre_contacto ?? "");
  const [emailContacto, setEmailContacto] = useState(cliente?.email_contacto ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse({
      rut_empresa: rutEmpresa,
      rubro,
      razon_social: razonSocial,
      telefono,
      direccion,
      nombre_contacto: nombreContacto,
      email_contacto: emailContacto,
    });
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
          className={`form-control ${errors.rut_empresa ? "is-invalid" : ""}`}
          id="cliente-rut-empresa"
          placeholder="76.086.428-5"
          value={rutEmpresa}
          onChange={(event) => setRutEmpresa(event.target.value)}
        />
        <label htmlFor="cliente-rut-empresa">RUT empresa</label>
        {errors.rut_empresa && <div className="invalid-feedback">{errors.rut_empresa}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.razon_social ? "is-invalid" : ""}`}
          id="cliente-razon-social"
          placeholder="Razón social"
          value={razonSocial}
          onChange={(event) => setRazonSocial(event.target.value)}
        />
        <label htmlFor="cliente-razon-social">Razón social</label>
        {errors.razon_social && <div className="invalid-feedback">{errors.razon_social}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.rubro ? "is-invalid" : ""}`}
          id="cliente-rubro"
          placeholder="Rubro"
          value={rubro}
          onChange={(event) => setRubro(event.target.value)}
        />
        <label htmlFor="cliente-rubro">Rubro</label>
        {errors.rubro && <div className="invalid-feedback">{errors.rubro}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.telefono ? "is-invalid" : ""}`}
          id="cliente-telefono"
          placeholder="Teléfono"
          value={telefono}
          onChange={(event) => setTelefono(event.target.value)}
        />
        <label htmlFor="cliente-telefono">Teléfono</label>
        {errors.telefono && <div className="invalid-feedback">{errors.telefono}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.direccion ? "is-invalid" : ""}`}
          id="cliente-direccion"
          placeholder="Dirección"
          value={direccion}
          onChange={(event) => setDireccion(event.target.value)}
        />
        <label htmlFor="cliente-direccion">Dirección</label>
        {errors.direccion && <div className="invalid-feedback">{errors.direccion}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.nombre_contacto ? "is-invalid" : ""}`}
          id="cliente-nombre-contacto"
          placeholder="Nombre de contacto"
          value={nombreContacto}
          onChange={(event) => setNombreContacto(event.target.value)}
        />
        <label htmlFor="cliente-nombre-contacto">Nombre de contacto</label>
        {errors.nombre_contacto && <div className="invalid-feedback">{errors.nombre_contacto}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="email"
          className={`form-control ${errors.email_contacto ? "is-invalid" : ""}`}
          id="cliente-email-contacto"
          placeholder="contacto@empresa.cl"
          value={emailContacto}
          onChange={(event) => setEmailContacto(event.target.value)}
        />
        <label htmlFor="cliente-email-contacto">Email de contacto</label>
        {errors.email_contacto && <div className="invalid-feedback">{errors.email_contacto}</div>}
      </div>

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
