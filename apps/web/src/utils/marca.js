import { ref } from "vue";
import axios from "axios";

// Marca del despliegue (nombre, color, logo, fondo, tema). Defaults = Varko.
export const marca = ref({
  nombre: "Varko",
  color: "",
  logo: "",
  fondo: "",
  tema: { fondo: "#f3f6fb", panel: "#e9eef6" },
});

export async function loadMarca() {
  try {
    const { data } = await axios.get("/api/ajustes/marca");
    marca.value = {
      nombre: data.nombre || "Varko",
      color: data.color || "",
      logo: data.logo || "",
      fondo: data.fondo || "",
      tema: data.tema || { fondo: "#f3f6fb", panel: "#e9eef6" },
    };
  } catch {
    /* mantiene defaults */
  }
  applyMarca();
}

const TEMA_BASE = { fondo: "#f3f6fb", panel: "#e9eef6" };

export function applyMarca() {
  try {
    document.title =
      marca.value.nombre === "Varko"
        ? "Varko · CRM"
        : `${marca.value.nombre} · CRM`;
    const root = document.documentElement;
    const t = marca.value.tema || TEMA_BASE;
    const personalizado =
      marca.value.color ||
      t.fondo !== TEMA_BASE.fondo ||
      t.panel !== TEMA_BASE.panel;
    if (personalizado) {
      if (marca.value.color) {
        root.style.setProperty("--crm-brand", marca.value.color);
        // Calculate contrasting foreground for brand color
        root.style.setProperty(
          "--crm-brand-fg",
          getContrastColor(marca.value.color),
        );
      } else {
        root.style.removeProperty("--crm-brand");
        root.style.removeProperty("--crm-brand-fg");
      }
      root.style.setProperty("--fondo", t.fondo || TEMA_BASE.fondo);
      root.style.setProperty("--panel", t.panel || TEMA_BASE.panel);
      document.body.classList.add("tema-marca");
    } else {
      root.style.removeProperty("--crm-brand");
      root.style.removeProperty("--crm-brand-fg");
      root.style.removeProperty("--fondo");
      root.style.removeProperty("--panel");
      document.body.classList.remove("tema-marca");
    }
  } catch {
    /* noop */
  }
}

/** Calculate contrasting color (black/white) for a given hex color */
function getContrastColor(hex) {
  try {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#1c1917" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}
