import type { Meta, StoryObj } from "@storybook/vue3";
import Modal from "../Modal.vue";
import Btn from "../Btn.vue";

const meta: Meta<typeof Modal> = {
  title: "Core/Modal",
  component: Modal,
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Control modal visibility",
    },
    title: {
      control: "text",
      description: "Modal title",
    },
    description: {
      control: "text",
      description: "Modal description for accessibility",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
      description: "Modal width",
    },
    closable: {
      control: "boolean",
      description: "Show close button",
    },
    showDefaultFooter: {
      control: "boolean",
      description: "Show default confirm/cancel footer",
    },
    confirmText: {
      control: "text",
      description: "Confirm button text",
    },
    submitLoading: {
      control: "boolean",
      description: "Show loading state on confirm",
    },
  },
  decorators: [
    (story) => ({
      components: { story, Btn },
      template: "<div><story /></div>",
    }),
  ],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    open: true,
    title: "Título del Modal",
    description: "Descripción del modal para accesibilidad",
  },
  render: (args) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <p class="text-[var(--fg-muted)]">
          Este es el contenido del modal. Puedes poner cualquier contenido aquí.
        </p>
      </Modal>
    `,
  }),
};

export const WithSlots: Story = {
  args: {
    open: true,
  },
  render: (args) => ({
    components: { Modal },
    template: `
      <Modal v-bind="args">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Confirmar Acción</h2>
          </div>
        </template>
        <p class="text-[var(--fg-muted)]">
          ¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.
        </p>
        <template #footer>
          <Btn variant="ghost" size="sm" @click="$emit('close')">Cancelar</Btn>
          <Btn variant="danger" size="sm" @click="$emit('confirm')">Eliminar</Btn>
        </template>
      </Modal>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { Modal },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
        <Modal size="sm" open title="Small">
          <p>Modal pequeño (380px)</p>
        </Modal>
        <Modal size="md" open title="Medium">
          <p>Modal mediano (480px)</p>
        </Modal>
        <Modal size="lg" open title="Large">
          <p>Modal grande (640px)</p>
        </Modal>
        <Modal size="xl" open title="Extra Large">
          <p>Modal extra grande (800px)</p>
        </Modal>
      </div>
    `,
  }),
};

export const WithForm: Story = {
  args: {
    open: true,
    title: "Nuevo Contacto",
    showDefaultFooter: true,
    confirmText: "Crear",
  },
  render: (args) => ({
    components: { Modal, Input, Btn },
    setup() {
      return { args };
    },
    template: `
      <Modal v-bind="args">
        <form class="space-y-4" @submit.prevent="args.close">
          <Input label="Nombre" placeholder="Nombre completo" required />
          <Input label="Email" type="email" placeholder="correo@ejemplo.com" required />
          <Input label="Teléfono" placeholder="+34 600 000 000" />
          <Input label="Empresa" placeholder="Empresa" />
        </form>
      </Modal>
    `,
  }),
};

export const ConfirmDialog: Story = {
  args: {
    open: true,
    title: "Confirmar Eliminación",
    description: "¿Estás seguro de que quieres eliminar este elemento?",
    showDefaultFooter: true,
    confirmText: "Eliminar",
  },
  render: (args) => ({
    components: { Modal },
    template: `
      <Modal v-bind="args">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[var(--fg)]">Eliminar contacto</h3>
            <p class="text-[var(--fg-muted)]">¿Estás seguro? Esta acción no se puede deshacer.</p>
          </div>
        </div>
      </Modal>
    `,
  }),
};

export const LoadingState: Story = {
  args: {
    open: true,
    title: "Guardando...",
    showDefaultFooter: true,
    submitLoading: true,
  },
};

export const WithoutClose: Story = {
  args: {
    open: true,
    title: "Sin botón cerrar",
    closable: false,
  },
};
