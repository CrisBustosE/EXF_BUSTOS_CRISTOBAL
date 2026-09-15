// Validación y normalización de RUT chileno (persona o empresa) por
// algoritmo de dígito verificador módulo 11.
//
// Copia intencional de apps/ventasfix-api/src/lib/rut.ts: STACK.md exige
// "monorepo sin workspaces" (cada app instala y corre por separado, sin
// paquetes compartidos), así que no hay forma de importar el módulo del
// backend desde acá. Si el algoritmo cambia, hay que actualizar ambas
// copias.

function computeDv(body: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

/** Acepta con o sin puntos/guion; devuelve "NNNNNNN-DV" o null si el formato no es un RUT. */
export function normalizeRut(raw: string): string | null {
  const clean = raw.replace(/[.\s]/g, "").toUpperCase();
  const match = /^(\d{1,8})-?(\d|K)$/.exec(clean);
  if (!match) return null;
  const [, body, dv] = match;
  return `${body}-${dv}`;
}

export function isValidRut(raw: string): boolean {
  const normalized = normalizeRut(raw);
  if (!normalized) return false;
  const [body, dv] = normalized.split("-");
  return computeDv(body) === dv;
}
