import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const Fuse = await import("fuse.js").then((m) => m.default);

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  section: string;
  action: () => void | Promise<void>;
  when?: () => boolean;
}

const commands = ref<CommandItem[]>([]);
const isOpen = ref(false);
const searchQuery = ref("");
const selectedIndex = ref(0);
const fuseInstance = ref(null);

export function registerCommand(command: CommandItem) {
  // Remove existing command with same id
  const idx = commands.value.findIndex((c) => c.id === command.id);
  if (idx >= 0) commands.value.splice(idx, 1);
  commands.value.push(command);
}

export function unregisterCommand(id: string) {
  const idx = commands.value.findIndex((c) => c.id === id);
  if (idx >= 0) commands.value.splice(idx, 1);
}

export function useCommandPalette() {
  const router = useRouter();
  const auth = useAuthStore();

  const buildFuse = () => {
    fuseInstance.value = new Fuse(commands.value, {
      keys: ["label", "description", "section"],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1,
    });
  };

  const filteredCommands = computed(() => {
    if (!fuseInstance.value) buildFuse();
    if (!searchQuery.value.trim()) {
      return commands.value.filter((c) => !c.when || c.when());
    }
    const results = fuseInstance.value.search(searchQuery.value);
    return results.map((r) => r.item).filter((c) => !c.when || c.when());
  });

  const open = () => {
    isOpen.value = true;
    searchQuery.value = "";
    selectedIndex.value = 0;
    buildFuse();
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    isOpen.value = false;
    searchQuery.value = "";
    selectedIndex.value = 0;
    document.body.style.overflow = "";
  };

  const select = async (index: number) => {
    const cmd = filteredCommands.value[index];
    if (!cmd) return;
    try {
      await cmd.action();
    } finally {
      close();
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (!isOpen.value) return;

    switch (e.key) {
      case "Escape":
        close();
        break;
      case "ArrowDown":
        e.preventDefault();
        selectedIndex.value = Math.min(
          selectedIndex.value + 1,
          filteredCommands.value.length - 1,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
        break;
      case "Enter":
        e.preventDefault();
        select(selectedIndex.value);
        break;
    }
  };

  // Global shortcut: Cmd/Ctrl + K
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (isOpen.value) close();
      else open();
    }
  };

  onMounted(() => {
    document.addEventListener("keydown", handleGlobalKeydown);
    document.addEventListener("keydown", handleKeydown);
    // Register default commands
    registerDefaultCommands();
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleGlobalKeydown);
    document.removeEventListener("keydown", handleKeydown);
  });

  const registerDefaultCommands = () => {
    // Navigation
    registerCommand({
      id: "nav-dashboard",
      label: "Ir al Dashboard",
      description: "Ver resumen general",
      icon: "Home",
      shortcut: "D",
      section: "Navegación",
      action: () => router.push("/"),
    });

    registerCommand({
      id: "nav-contactos",
      label: "Contactos",
      description: "Gestionar contactos",
      icon: "Users",
      shortcut: "C",
      section: "Navegación",
      action: () => router.push("/contactos"),
    });

    registerCommand({
      id: "nav-oportunidades",
      label: "Oportunidades",
      description: "Pipeline de ventas",
      icon: "Target",
      shortcut: "O",
      section: "Navegación",
      action: () => router.push("/oportunidades"),
    });

    registerCommand({
      id: "nav-tareas",
      label: "Tareas",
      description: "Mis tareas pendientes",
      icon: "CheckSquare",
      shortcut: "T",
      section: "Navegación",
      action: () => router.push("/tareas"),
    });

    registerCommand({
      id: "nav-campanas",
      label: "Campañas",
      description: "Email marketing",
      icon: "Mail",
      shortcut: "M",
      section: "Navegación",
      action: () => router.push("/campañas"),
    });

    registerCommand({
      id: "nav-pipeline",
      label: "Pipeline",
      description: "Ver pipeline Kanban",
      icon: "Kanban",
      shortcut: "P",
      section: "Navegación",
      action: () => router.push("/pipeline"),
    });

    // Crear
    registerCommand({
      id: "new-contacto",
      label: "Nuevo Contacto",
      description: "Crear un contacto",
      icon: "UserPlus",
      shortcut: "N",
      section: "Crear",
      action: () => router.push("/contactos/nuevo"),
    });

    registerCommand({
      id: "new-oportunidad",
      label: "Nueva Oportunidad",
      description: "Crear una oportunidad",
      icon: "PlusCircle",
      shortcut: "N",
      section: "Crear",
      action: () => router.push("/oportunidades/nuevo"),
    });

    registerCommand({
      id: "new-tarea",
      label: "Nueva Tarea",
      description: "Crear una tarea",
      icon: "Plus",
      shortcut: "N",
      section: "Crear",
      action: () => router.push("/tareas/nueva"),
    });

    // Acciones
    registerCommand({
      id: "toggle-theme",
      label: "Cambiar tema",
      description: "Alternar modo oscuro/claro",
      icon: "Moon",
      shortcut: "T",
      section: "Acciones",
      action: () => {
        const html = document.documentElement;
        const isDark = html.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      },
      when: () => true,
    });

    // Configuración
    registerCommand({
      id: "settings-profile",
      label: "Mi Perfil",
      description: "Configurar mi cuenta",
      icon: "User",
      shortcut: "P",
      section: "Configuración",
      action: () => router.push("/settings/profile"),
    });

    registerCommand({
      id: "settings-general",
      label: "Configuración General",
      description: "Ajustes de la aplicación",
      icon: "Settings",
      shortcut: "G",
      section: "Configuración",
      action: () => router.push("/settings"),
    });
  };

  return {
    isOpen,
    searchQuery,
    selectedIndex,
    filteredCommands,
    open,
    close,
    select,
    registerCommand,
    unregisterCommand,
  };
}
