"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { isValidRut } from "@/lib/rut";
import type { UsuarioRow } from "./types";

const rutField = z
  .string()
  .trim()
  .min(1, "El rut es requerido")
  .refine(isValidRut, "RUT inválido (dígito verificador no coincide)");

const emailField = z
  .string()
  .trim()
  .min(1, "El email es requerido")
  .email("Email inválido")
  .refine((value) => value.toLowerCase().endsWith("@ventasfix.cl"), {
    message: "El email debe terminar en @ventasfix.cl",
  });

export type UsuarioFormValues = {
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
};

type UsuarioFormProps = {
  /** null = crear; un usuario existente = editar (formulario no decide el verbo HTTP). */
  usuario: UsuarioRow | null;
  onSubmit: (values: UsuarioFormValues) => Promise<void>;
  onCancel: () => void;
  serverError?: string | null;
};

export default function UsuarioForm({ usuario, onSubmit, onCancel, serverError }: UsuarioFormProps) {
  const isEditing = usuario !== null;

  const [rut, setRut] = useState(usuario?.rut ?? "");
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [apellido, setApellido] = useState(usuario?.apellido ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    rut: rutField,
    nombre: z.string().trim().min(1, "El nombre es requerido"),
    apellido: z.string().trim().min(1, "El apellido es requerido"),
    email: emailField,
    // Al editar, vacío = "no cambiar la contraseña" (ver src/lib/api-proxy.ts
    // y usuarioUpdateSchema en ventasfix-api); al crear, siempre requerido.
    password: isEditing ? z.string() : z.string().trim().min(1, "El password es requerido"),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse({ rut, nombre, apellido, email, password });
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
          className={`form-control ${errors.rut ? "is-invalid" : ""}`}
          id="usuario-rut"
          placeholder="12.345.678-9"
          value={rut}
          onChange={(event) => setRut(event.target.value)}
        />
        <label htmlFor="usuario-rut">RUT</label>
        {errors.rut && <div className="invalid-feedback">{errors.rut}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
          id="usuario-nombre"
          placeholder="Nombre"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
        <label htmlFor="usuario-nombre">Nombre</label>
        {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="text"
          className={`form-control ${errors.apellido ? "is-invalid" : ""}`}
          id="usuario-apellido"
          placeholder="Apellido"
          value={apellido}
          onChange={(event) => setApellido(event.target.value)}
        />
        <label htmlFor="usuario-apellido">Apellido</label>
        {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="email"
          className={`form-control ${errors.email ? "is-invalid" : ""}`}
          id="usuario-email"
          placeholder="nombre@ventasfix.cl"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="usuario-email">Email</label>
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>

      <div className="form-floating mb-3">
        <input
          type="password"
          className={`form-control ${errors.password ? "is-invalid" : ""}`}
          id="usuario-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <label htmlFor="usuario-password">
          {isEditing ? "Password (dejar vacío para no cambiarla)" : "Password"}
        </label>
        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
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
