import type { Config } from "tailwindcss";

// Tremor arma las clases de color en tiempo de ejecución (`stroke-${color}-500`),
// así que Tailwind no las ve al escanear y no las genera: las gráficas salían
// sin color. Se listan aquí solo los colores que usan las gráficas.
const CHART_COLORS = "blue|emerald|red";
const SHADES = "50|100|200|300|400|500|600|700|800|900|950";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: new RegExp(`^(bg|text|border|ring|stroke|fill)-(${CHART_COLORS})-(${SHADES})$`),
      variants: ["hover", "ui-selected"],
    },
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
