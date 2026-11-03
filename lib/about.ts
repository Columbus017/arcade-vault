import type { NeonColor } from "@/lib/home";

export interface Highlight {
  icon: "HEART" | "BROWSER" | "PLANT";
  text: string;
  color: Extract<NeonColor, "magenta" | "cyan" | "green">;
}

export const HIGHLIGHTS: Highlight[] = [
  { icon: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  {
    icon: "BROWSER",
    text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",
    color: "cyan",
  },
  { icon: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" },
];
