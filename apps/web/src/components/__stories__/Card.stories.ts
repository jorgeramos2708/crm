import type { Meta, StoryObj } from "@storybook/vue3";
import Card from "../Card.vue";

const meta: Meta<typeof Card> = {
  title: "Core/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["flat", "elevated", "interactive", "gradient", "glass"],
      description: "Visual variant of the card",
    },
    padding: {
      control: "select",
      options: ["none", "sm", "default", "lg", "xl"],
      description: "Internal padding",
    },
    hover: {
      control: "boolean",
      description: "Enable hover lift effect",
    },
    clickable: {
      control: "boolean",
      description: "Make card clickable",
    },
    disabled: {
      control: "boolean",
      description: "Disable interactions",
    },
    bordered: {
      control: "boolean",
      description: "Show border",
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template:
        '<div style="display: flex; flex-wrap: wrap; gap: 1.5rem; max-width: 800px;"><story /></div>',
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Flat: Story = {
  args: {
    variant: "flat",
    default: "Card flat sin sombra ni borde elevado",
  },
};

export const Elevated: Story = {
  args: {
    variant: "elevated",
    default: "Card elevada con sombra suave",
  },
};

export const Interactive: Story = {
  args: {
    variant: "interactive",
    clickable: true,
    default: "Card interactiva con hover lift",
  },
};

export const Gradient: Story = {
  args: {
    variant: "gradient",
    default: "Card con borde gradient brand",
  },
};

export const Glass: Story = {
  args: {
    variant: "glass",
    default: "Card glassmorphism con blur",
  },
};

export const WithSlots: Story = {
  args: {
    variant: "elevated",
  },
  render: (args) => ({
    components: { Card },
    template: `
      <Card v-bind="args" style="width: 350px;">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Título de la Card</h3>
            <Badge color="green">Activo</Badge>
          </div>
        </template>
        <p class="text-[var(--fg-muted)]">
          Este es el contenido principal de la card con <code>variant="elevated"</code>.
          Puedes usar slots para header, contenido principal y footer.
        </p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Btn variant="ghost" size="sm">Cancelar</Btn>
            <Btn variant="primary" size="sm">Guardar</Btn>
          </div>
        </template>
      </Card>
    `,
  }),
};

export const PaddingVariants: Story = {
  render: () => ({
    components: { Card },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1.5rem;">
        <Card variant="flat" padding="none" style="width: 200px;">
          <p class="font-medium">padding="none"</p>
          <p class="text-sm text-[var(--fg-muted)]">Sin padding interno</p>
        </Card>
        <Card variant="flat" padding="sm" style="width: 200px;">
          <p class="font-medium">padding="sm"</p>
          <p class="text-sm text-[var(--fg-muted)]">12px padding</p>
        </Card>
        <Card variant="flat" padding="default" style="width: 200px;">
          <p class="font-medium">padding="default"</p>
          <p class="text-sm text-[var(--fg-muted)]">24px padding</p>
        </Card>
        <Card variant="flat" padding="lg" style="width: 200px;">
          <p class="font-medium">padding="lg"</p>
          <p class="text-sm text-[var(--fg-muted)]">32px padding</p>
        </Card>
        <Card variant="flat" padding="xl" style="width: 200px;">
          <p class="font-medium">padding="xl"</p>
          <p class="text-sm text-[var(--fg-muted)]">40px padding</p>
        </Card>
      </div>
    `,
  }),
};

export const InteractiveGrid: Story = {
  render: () => ({
    components: { Card, Btn, Icon },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
        <Card variant="interactive" clickable padding="default" @click="console.log('clicked')">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Nueva Oportunidad</h3>
              <Icon name="plus" class="h-5 w-5 text-[var(--brand)]" />
            </div>
          </template>
          <p class="text-[var(--fg-muted)]">Crear una nueva oportunidad en el pipeline</p>
          <template #footer>
            <Btn variant="primary" size="sm" class="w-full">Crear</Btn>
          </template>
        </Card>
        
        <Card variant="interactive" clickable padding="default">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Nuevo Contacto</h3>
              <Icon name="user-plus" class="h-5 w-5 text-[var(--brand)]" />
            </div>
          </template>
          <p class="text-[var(--fg-muted)]">Agregar un nuevo contacto a la base de datos</p>
          <template #footer>
            <Btn variant="primary" size="sm" class="w-full">Agregar</Btn>
          </template>
        </Card>
        
        <Card variant="interactive" clickable padding="default">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Nueva Tarea</h3>
              <Icon name="check-square" class="h-5 w-5 text-[var(--brand)]" />
            </div>
          </template>
          <p class="text-[var(--fg-muted)]">Crear una tarea pendiente vinculada</p>
          <template #footer>
            <Btn variant="primary" size="sm" class="w-full">Crear</Btn>
          </template>
        </Card>
      </div>
    `,
  }),
};
