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
      const fondo = t.fondo || TEMA_BASE.fondo;
      const panel = t.panel || TEMA_BASE.panel;
      if (marca.value.color) {
        root.style.setProperty("--marca", marca.value.color);
        root.style.setProperty("--crm-brand", marca.value.color);
        // Calculate contrasting foreground for brand color
        root.style.setProperty(
          "--crm-brand-fg",
          getContrastColor(marca.value.color),
        );
        // Activa el override completo ([data-theme-custom] deriva --brand,
        // --brand-hover y --brand-light de --marca). Solo con color: sin él,
        // var(--marca) quedaría inválido y se perdería el azul Varko.
        root.setAttribute("data-theme-custom", "");
      } else {
        root.style.removeProperty("--marca");
        root.style.removeProperty("--crm-brand");
        root.style.removeProperty("--crm-brand-fg");
        root.removeAttribute("data-theme-custom");
      }
      // Superficies que los componentes leen con estos nombres. En oscuro
      // NO aplican las claras de la marca: mandan los tokens del tema.
      const oscuro = root.classList.contains("dark");
      const superficies = [
        ["--crm-bg", fondo],
        ["--crm-bg-secondary", panel],
        ["--fondo", fondo],
        ["--panel", panel],
      ];
      for (const [prop, valor] of superficies) {
        if (oscuro) root.style.removeProperty(prop);
        else root.style.setProperty(prop, valor);
      }
      document.body.classList.add("tema-marca");
    } else {
      root.style.removeProperty("--marca");
      root.style.removeProperty("--crm-brand");
      root.style.removeProperty("--crm-brand-fg");
      root.removeAttribute("data-theme-custom");
      root.style.removeProperty("--crm-bg");
      root.style.removeProperty("--crm-bg-secondary");
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
