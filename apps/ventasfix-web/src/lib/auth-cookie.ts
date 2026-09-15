// Nombre de la cookie httpOnly que guarda el JWT de sesión. Compartido
// entre el BFF de login (la setea), proxy.ts (la lee) y el logout (la borra).
export const COOKIE_NAME = "token";
