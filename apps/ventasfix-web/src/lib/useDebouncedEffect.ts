import { useEffect, useRef } from "react";

/**
 * Corre `callback` `delay` ms después del último cambio en `deps`,
 * cancelando cualquier ejecución pendiente si `deps` vuelve a cambiar antes
 * (debounce estándar vía cleanup de useEffect: React garantiza que el
 * cleanup anterior corre antes del próximo efecto, así que solo la última
 * ejecución sobrevive). No corre en el mount inicial — evita re-disparar
 * con el valor que ya viene de la URL al cargar la página.
 */
export function useDebouncedEffect(callback: () => void, deps: unknown[], delay: number) {
  const isMount = useRef(true);

  useEffect(() => {
    if (isMount.current) {
      isMount.current = false;
      return;
    }
    const timer = setTimeout(callback, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
