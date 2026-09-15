import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Si la respuesta es 401 (sesión inválida — token expirado, o el propio
 * usuario fue eliminado mientras esta pantalla seguía abierta, ver
 * 3.3.5/4 del README), redirige a /login en vez de dejar que el caller
 * muestre un error inline sobre una sesión muerta. Cubre además el caso
 * borde de una página protegida restaurada desde el bfcache al navegar
 * atrás (el Cache-Control: no-store de proxy.ts ya evita eso en el
 * primer nivel; esto es la segunda defensa, en la primera acción real).
 *
 * Devuelve `true` si redirigió — el caller debe cortar ahí mismo
 * (`return`), no seguir procesando la respuesta.
 */
export function redirectIfUnauthorized(res: Response, router: AppRouterInstance): boolean {
  if (res.status !== 401) return false;
  router.push("/login");
  return true;
}
