<template>
  <Teleport to="body">
    <div v-if="isOpen" class="command-palette-overlay" @click="close">
      <div
        class="command-palette"
        @click.stop
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div class="command-palette-header">
          <label for="command-palette-input" class="sr-only">Buscar comandos</label>
          <div class="command-palette-input-wrapper">
            <svg class="command-palette-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              id="command-palette-input"
              type="text"
              v-model="searchQuery"
              placeholder="Escribe un comando o busca..."
              class="command-palette-input"
              @keydown="handleKeydown"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              ref="inputRef"
            />
          </div>
        </div>

        <div class="command-palette-content" role="listbox" aria-label="Resultados">
          <template v-for="(section, sectionIndex) in groupedCommands" :key="sectionIndex">
            <div class="command-palette-section">
              <div class="command-palette-section-title">{{ section.name }}</div>
              <div class="command-palette-items" role="group">
                <button
                  v-for="(cmd, cmdIndex) in section.items"
                  :key="cmd.id"
                  class="command-palette-item"
                  :class="{ 'is-selected': getGlobalIndex(cmdIndex, sectionIndex) === selectedIndex }"
                  role="option"
                  :aria-selected="getGlobalIndex(cmdIndex, sectionIndex) === selectedIndex"
                  @click="select(getGlobalIndex(cmdIndex, sectionIndex))"
                  @mouseenter="selectedIndex = getGlobalIndex(cmdIndex, sectionIndex)"
                >
                  <div class="command-palette-item-main">
                    <span v-if="cmd.icon" class="command-palette-item-icon">
                      <component :is="resolveIcon(cmd.icon)" class="w-5 h-5" />
                    </span>
                    <div class="command-palette-item-text">
                      <span class="command-palette-item-label">{{ cmd.label }}</span>
                      <span v-if="cmd.description" class="command-palette-item-description">{{ cmd.description }}</span>
                    </div>
                  </div>
                  <kbd v-if="cmd.shortcut" class="command-palette-item-shortcut">{{ cmd.shortcut }}</kbd>
                </button>
              </div>
            </div>
          </template>

          <div v-if="filteredCommands.length === 0 && searchQuery" class="command-palette-empty">
            <p>No se encontraron comandos para "{{ searchQuery }}"</p>
          </div>
        </div>

        <div class="command-palette-footer">
          <span class="command-palette-hint">↑↓ Navegar · Enter Seleccionar · Esc Cerrar</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useCommandPalette } from '@/composables/useCommandPalette';
import Fuse from 'fuse.js';
import {
  Home,
  Users,
  Target,
  CheckSquare,
  Mail,
  Kanban,
  UserPlus,
  PlusCircle,
  Plus,
  Moon,
  Sun,
  User,
  Settings,
} from '@lucide/vue';

const props = defineProps<{
  open?: boolean;
  commands?: Array<{
    id: string;
    label: string;
    group: string;
    to?: string;
    icon?: string;
    description?: string;
    shortcut?: string;
    run?: () => void;
  }>;
}>();

const emit = defineEmits<{
  close: [];
  select: [cmd: any];
  'update:open': [value: boolean];
}>();

const router = useRouter();
const inputRef = ref<HTMLInputElement | null>(null);

const {
  isOpen: composableIsOpen,
  searchQuery,
  selectedIndex,
  filteredCommands: composableFilteredCommands,
  close: composableClose,
  select: composableSelect,
  registerCommand,
  unregisterCommand,
  commands: composableCommands,
  open: composableOpen,
} = useCommandPalette();

// Use props commands for testing, otherwise use composable commands
const allCommands = computed(() => {
  if (props.commands && props.commands.length > 0) {
    return props.commands;
  }
  return composableCommands.value;
});

const fuseInstance = ref<any>(null);
let fuseBuiltFor: unknown[] | null = null;

const buildFuse = () => {
  const cmds = allCommands.value;
  fuseInstance.value = new Fuse(cmds, {
    keys: ["label", "description", "group"],
    // Búsqueda de paleta: tolerante a subcadenas ("cont" debe hallar
    // "Ir a Contactos"). Sin ignoreLocation, los matches no iniciales
    // puntúan >0.3 y la lista queda vacía.
    threshold: 0.45,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 1,
  });
};

const filteredCommands = computed(() => {
  if (!searchQuery.value.trim()) {
    return allCommands.value.filter(cmd => !cmd.when || cmd.when());
  }
  // Reindexar si cambió el catálogo (p. ej. comandos cargados tras login).
  if (!fuseInstance.value || fuseBuiltFor !== allCommands.value) {
    buildFuse();
    fuseBuiltFor = allCommands.value;
  }
  const results = fuseInstance.value.search(searchQuery.value);
  return results.map(r => r.item).filter(cmd => !cmd.when || cmd.when());
});

const isOpen = computed({
  get: () => props.open ?? composableIsOpen.value,
  set: (val) => {
    if (props.open !== undefined) {
      emit('update:open', val);
    } else {
      composableIsOpen.value = val;
    }
  }
});

const close = () => {
  isOpen.value = false;
  emit("close");
};

const select = (index: number) => {
  const cmd = filteredCommands.value[index];
  if (!cmd) return;
  try {
    if (cmd.to) {
      router.push(cmd.to);
    } else if (cmd.run) {
      cmd.run();
    }
  } finally {
    close();
    emit('select', cmd);
  }
};

const groupedCommands = computed(() => {
  const sections: Record<string, typeof filteredCommands.value> = {};
  for (const cmd of filteredCommands.value) {
    if (!sections[cmd.group]) sections[cmd.group] = [];
    sections[cmd.group].push(cmd);
  }
  return Object.entries(sections).map(([name, items]) => ({ name, items }));
});

const getGlobalIndex = (cmdIndex: number, sectionIndex: number): number => {
  let index = 0;
  for (let i = 0; i < sectionIndex; i++) {
    index += groupedCommands.value[i].items.length;
  }
  return index + cmdIndex;
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return;
  if (e.key === 'Escape') {
    close();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    select(selectedIndex.value);
  }
};

// Global shortcut: Cmd/Ctrl + K
const handleGlobalKeydown = (e: KeyboardEvent) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;
  if (modifier && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isOpen.value = !isOpen.value;
  }
};

watch(isOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
    nextTick(() => {
      inputRef.value?.focus();
    });
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('keydown', handleKeydown);
  
  // Register default commands if no props commands provided
  if (!props.commands) {
    registerDefaultCommands();
  }
  
  buildFuse();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('keydown', handleKeydown);
});

const registerDefaultCommands = () => {
  // Navigation
  registerCommand({
    id: 'nav-dashboard',
    label: 'Ir al Dashboard',
    description: 'Ver resumen general',
    icon: 'Home',
    shortcut: 'D',
    group: 'Navegación',
    action: () => router.push('/'),
  });

  registerCommand({
    id: 'nav-contactos',
    label: 'Contactos',
    description: 'Gestionar contactos',
    icon: 'Users',
    shortcut: 'C',
    group: 'Navegación',
    action: () => router.push('/contactos'),
  });

  registerCommand({
    id: 'nav-oportunidades',
    label: 'Oportunidades',
    description: 'Pipeline de ventas',
    icon: 'Target',
    shortcut: 'O',
    group: 'Navegación',
    action: () => router.push('/oportunidades'),
  });

  registerCommand({
    id: 'nav-tareas',
    label: 'Tareas',
    description: 'Mis tareas pendientes',
    icon: 'CheckSquare',
    shortcut: 'T',
    group: 'Navegación',
    action: () => router.push('/tareas'),
  });

  registerCommand({
    id: 'nav-campanas',
    label: 'Campañas',
    description: 'Email marketing',
    icon: 'Mail',
    shortcut: 'M',
    group: 'Navegación',
    action: () => router.push('/campañas'),
  });

  registerCommand({
    id: 'nav-pipeline',
    label: 'Pipeline',
    description: 'Ver pipeline Kanban',
    icon: 'Kanban',
    shortcut: 'P',
    group: 'Navegación',
    action: () => router.push('/pipeline'),
  });

  // Crear
  registerCommand({
    id: 'new-contacto',
    label: 'Nuevo Contacto',
    description: 'Crear un contacto',
    icon: 'UserPlus',
    shortcut: 'N',
    group: 'Crear',
    action: () => router.push('/contactos/nuevo'),
  });

  registerCommand({
    id: 'new-oportunidad',
    label: 'Nueva Oportunidad',
    description: 'Crear una oportunidad',
    icon: 'PlusCircle',
    shortcut: 'N',
    group: 'Crear',
    action: () => router.push('/oportunidades/nuevo'),
  });

  registerCommand({
    id: 'new-tarea',
    label: 'Nueva Tarea',
    description: 'Crear una tarea',
    icon: 'Plus',
    shortcut: 'N',
    group: 'Crear',
    action: () => router.push('/tareas/nueva'),
  });

  // Acciones
  registerCommand({
    id: 'toggle-theme',
    label: 'Cambiar tema',
    description: 'Alternar modo oscuro/claro',
    icon: 'Moon',
    shortcut: 'T',
    group: 'Acciones',
    action: () => {
      const html = document.documentElement;
      const isDark = html.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    },
    when: () => true,
  });

  // Configuración
  registerCommand({
    id: 'settings-profile',
    label: 'Mi Perfil',
    description: 'Configurar mi cuenta',
    icon: 'User',
    shortcut: 'P',
    group: 'Configuración',
    action: () => router.push('/settings/profile'),
  });

  registerCommand({
    id: 'settings-general',
    label: 'Configuración General',
    description: 'Ajustes de la aplicación',
    icon: 'Settings',
    shortcut: 'G',
    group: 'Configuración',
    action: () => router.push('/settings'),
  });
};

const iconMap = {
  Home,
  Users,
  Target,
  CheckSquare,
  Mail,
  Kanban,
  UserPlus,
  PlusCircle,
  Plus,
  Moon,
  Sun,
  User,
  Settings,
};

const resolveIcon = (name: string) => iconMap[name as keyof typeof iconMap] || Home;
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.command-palette {
  width: 100%;
  max-width: 640px;
  margin: 0 1rem;
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideDown 0.15s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.command-palette-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.command-palette-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.command-palette-search-icon {
  position: absolute;
  left: 1rem;
  width: 20px;
  height: 20px;
  color: var(--color-text-muted, #64748b);
  flex-shrink: 0;
}

.command-palette-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 3rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text, #0f172a);
  background: var(--color-bg-secondary, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius, 0.5rem);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.command-palette-input:focus {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--color-focus, rgba(37, 99, 235, 0.2));
}

.command-palette-input::placeholder {
  color: var(--color-text-muted, #64748b);
}

.command-palette-shortcut {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-family: inherit;
  color: var(--color-text-muted, #64748b);
  background: var(--color-bg-secondary, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-sm, 0.375rem);
}

.command-palette-content {
  max-height: 50vh;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.command-palette-section {
  margin: 0;
}

.command-palette-section-title {
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #64748b);
}

.command-palette-items {
  display: flex;
  flex-direction: column;
}

.command-palette-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}

.command-palette-item:hover,
.command-palette-item.is-selected {
  background: var(--color-bg-secondary, #f8fafc);
}

.command-palette-item-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.command-palette-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-primary, #2563eb);
  flex-shrink: 0;
}

.command-palette-item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.command-palette-item-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-palette-item-description {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-palette-item-shortcut {
  padding: 0.125rem 0.5rem;
  font-size: 0.65rem;
  font-family: inherit;
  color: var(--color-text-muted, #64748b);
  background: var(--color-bg-secondary, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-sm, 0.375rem);
  flex-shrink: 0;
}

.command-palette-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted, #64748b);
  font-size: 0.875rem;
}

.command-palette-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-bg-secondary, #f8fafc);
}

.command-palette-hint {
  font-size: 0.7rem;
  color: var(--color-text-muted, #64748b);
  text-align: center;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .command-palette {
    background: var(--color-bg, #1e293b);
  }
}
</style>