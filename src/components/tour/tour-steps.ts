// Contenido del tutorial, por página. Cada paso señala un elemento marcado
// con data-tour="<nombre>" en la interfaz.
//
// - target: nombre del data-tour. Si es una lista, se usa el primero que esté
//   visible (p. ej. el menú lateral en escritorio y el botón ☰ en móvil).
// - Sin target, la nota aparece centrada (sirve para la bienvenida).
// - Si el elemento no existe o no se ve (p. ej. no hay más páginas que
//   cargar), el paso se omite en lugar de mostrar una nota flotando sin sentido.

export interface TourStep {
  target?: string | string[];
  title: string;
  text: string | ((ctx: { isDemo: boolean }) => string);
  side?: "top" | "bottom" | "left" | "right";
}

const NAV = ["nav", "menu"];

export const TOURS: Record<string, TourStep[]> = {
  "/overview": [
    {
      title: "Bienvenido 👋",
      text: "Este dashboard junta tus cuentas bancarias, categoriza cada movimiento con IA y te muestra hacia dónde va tu dinero. Te enseño dónde está cada cosa en unos segundos. Puedes salir cuando quieras con Esc.",
    },
    {
      target: "demo-banner",
      title: "Estás en la cuenta demo",
      text: "Los datos son de ejemplo y no se pueden modificar. Para usar tus propias cuentas, cierra sesión y entra con Google.",
    },
    {
      target: NAV,
      title: "Secciones",
      text: "Desde aquí cambias de sección: Resumen, Transacciones, Cuentas, Insights IA, Proyecciones y Conectar banco. En el celular, este menú se abre con el botón ☰.",
      side: "right",
    },
    {
      target: "account-filter",
      title: "Filtra por cuenta",
      text: "Elige una cuenta para ver solo sus movimientos, o «Todas las cuentas» para verlas juntas. El filtro se mantiene al cambiar de sección.",
    },
    {
      target: "date-filter",
      title: "Elige el periodo",
      text: "Haz clic en un periodo (7 días, 30 días, 12 meses…) y todos los números de la página se recalculan para ese rango.",
    },
    {
      target: "summary-cards",
      title: "Tus números del periodo",
      text: "Cuánto entró, cuánto salió y la diferencia entre los dos. Si el balance sale en rojo, gastaste más de lo que ganaste en ese periodo.",
    },
    {
      target: "trend-chart",
      title: "Tendencia mensual",
      text: "Ingresos (verde) contra gastos (rojo) de los últimos 6 meses. Pasa el cursor sobre la gráfica para ver el monto de cada mes.",
    },
    {
      target: "top-categories",
      title: "¿En qué se va el dinero?",
      text: "Las 5 categorías donde más gastaste en el periodo elegido.",
    },
    {
      target: "privacy",
      title: "Ocultar montos",
      text: "Si vas a compartir pantalla, haz clic aquí y todas las cantidades se reemplazan por ••••.",
      side: "right",
    },
    {
      target: "help",
      title: "¿Te perdiste?",
      text: "Cada sección tiene su propia guía. Haz clic en este botón cuando quieras repetir la de la página en la que estés.",
      side: "left",
    },
  ],

  "/transactions": [
    {
      target: "tx-table",
      title: "Todos tus movimientos",
      text: "Aquí está cada transacción del periodo y la cuenta que elegiste arriba. Haz clic en el encabezado de una columna para ordenar por fecha, descripción o monto.",
    },
    {
      target: "category-select",
      title: "Categoría asignada por IA",
      text: ({ isDemo }) =>
        isDemo
          ? "Cada movimiento se categoriza solo. Con tu propia cuenta puedes corregir la categoría desde este menú; en el demo está desactivado porque es de solo lectura."
          : "Cada movimiento se categoriza solo. Si la IA se equivocó, elige la categoría correcta en este menú: se guarda al instante.",
      side: "left",
    },
    {
      target: "load-more",
      title: "Ver más",
      text: "La lista carga de 50 en 50. Haz clic aquí para traer los siguientes movimientos.",
      side: "top",
    },
  ],

  "/accounts": [
    {
      target: "net-worth",
      title: "Patrimonio neto",
      text: "Lo que tienes en tus cuentas menos lo que debes en tarjetas.",
      side: "left",
    },
    {
      target: "account-cards",
      title: "Tus cuentas",
      text: "Cada tarjeta muestra el saldo de una cuenta, cuántos movimientos tiene y cuándo se sincronizó por última vez con el banco.",
    },
  ],

  "/insights": [
    {
      target: "subscriptions",
      title: "Suscripciones detectadas",
      text: "Cargos que se repiten con el mismo monto cada semana o cada mes (streaming, gimnasio, servicios). Ves cuánto te cuestan al año y cuándo es el próximo cobro.",
    },
    {
      target: "anomalies",
      title: "Gastos inusuales",
      text: "Compras mucho más altas que tu promedio en esa categoría. Sirve para detectar cargos raros o gastos que se salieron de lo normal.",
    },
    {
      target: "ai-efficiency",
      title: "Cómo trabaja la IA",
      text: "Cada comercio nuevo se categoriza con IA una sola vez; después se reutiliza la respuesta. Aquí ves cuántas llamadas a la IA se ahorraron así.",
    },
  ],

  "/projections": [
    {
      target: "horizon",
      title: "¿Qué tan lejos ver?",
      text: "Elige si quieres proyectar tu saldo a 3, 6 o 12 meses.",
      side: "left",
    },
    {
      target: "projection-metrics",
      title: "Tu promedio mensual",
      text: "Ingreso y gasto promedio de los últimos meses completos. El flujo neto es la diferencia: lo que te queda (o te falta) cada mes.",
    },
    {
      target: "projection-chart",
      title: "Saldo hacia adelante",
      text: "La línea azul es tu saldo real de los meses pasados; la verde, cómo seguiría si mantienes el mismo ritmo. Es una estimación simple, no una predicción.",
    },
    {
      target: "committed",
      title: "Gastos comprometidos",
      text: "La parte de tu gasto mensual que ya está apartada en suscripciones y cargos fijos.",
    },
  ],

  "/connect": [
    {
      target: "connect-button",
      title: "Conecta tu banco",
      text: ({ isDemo }) =>
        isDemo
          ? "Con tu propia cuenta, este botón abre Plaid para conectar un banco. En el demo está desactivado."
          : "Haz clic para abrir Plaid, el servicio que conecta con tu banco. Tus credenciales se escriben en Plaid, nunca en esta app.",
    },
    {
      target: "sandbox-note",
      title: "Estamos en modo prueba",
      text: "No uses tu banco real: elige cualquier banco de la lista y entra con el usuario user_good y la contraseña pass_good.",
    },
  ],
};
