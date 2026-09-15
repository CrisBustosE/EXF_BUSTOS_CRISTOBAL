/** Convierte un segmento de ruta dinámico a id numérico; null si no es un entero positivo. */
export function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  return Number(raw);
}
