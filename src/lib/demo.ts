// Compartido entre servidor (auth, permisos) y cliente (avisos en la UI).
// La cuenta demo la usa cualquiera que entre: es de solo lectura.
export const DEMO_EMAIL = "demo@finanzas.app";

export const isDemoEmail = (email?: string | null) => email === DEMO_EMAIL;

export const DEMO_READONLY_MESSAGE =
  "La cuenta demo es de solo lectura. Inicia sesión con Google para usar tus propios datos.";
