import type { Meta, StoryObj } from "@storybook/vue3";
import Btn from "../Btn.vue";
import Icon from "../Icon.vue";

const meta: Meta<typeof Btn> = {
  title: "Core/Btn",
  component: Btn,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "outline",
        "ghost",
        "link",
        "danger",
        "success",
        "icon",
      ],
      description: "Visual style variant",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Button size",
    },
    disabled: {
      control: "boolean",
      description: "Disable the button",
    },
    loading: {
      control: "boolean",
      description: "Show loading spinner",
    },
    to: {
      control: "text",
      description: "Router link target",
    },
    href: {
      control: "text",
      description: "Anchor link target",
    },
    type: {
      control: "select",
      options: ["button", "submit", "reset"],
      description: "Native button type",
    },
  },
  decorators: [
    (story) => ({
      components: { story, Icon },
      template:
        '<div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;"><story /></div>',
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof Btn>;

export const Primary: Story = {
  args: {
    variant: "primary",
    default: "Botón primario",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    default: "Botón secundario",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    default: "Botón outline",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    default: "Botón ghost",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    default: "Eliminar",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    default: "Guardar",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    default: "Enlace",
  },
};

export const IconButton: Story = {
  args: {
    variant: "icon",
    size: "md",
    default: "",
  },
  decorators: [
    (story) => ({
      components: { story, Icon },
      template:
        '<div><story><Icon name="plus" class="h-5 w-5" /></story></div>',
    }),
  ],
};

export const Sizes: Story = {
  render: () => ({
    components: { Btn, Icon },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
        <Btn size="xs">Extra Small</Btn>
        <Btn size="sm">Small</Btn>
        <Btn size="md">Medium</Btn>
        <Btn size="lg">Large</Btn>
        <Btn size="xl">Extra Large</Btn>
      </div>
    `,
  }),
};

export const Variants: Story = {
  render: () => ({
    components: { Btn, Icon },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
        <Btn variant="primary">Primary</Btn>
        <Btn variant="secondary">Secondary</Btn>
        <Btn variant="outline">Outline</Btn>
        <Btn variant="ghost">Ghost</Btn>
        <Btn variant="danger">Danger</Btn>
        <Btn variant="success">Success</Btn>
        <Btn variant="link">Link</Btn>
      </div>
    `,
  }),
};

export const Loading: Story = {
  args: {
    loading: true,
    default: "Cargando...",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    default: "Deshabilitado",
  },
};

export const AsRouterLink: Story = {
  args: {
    to: "/dashboard",
    default: "Ir al Dashboard",
  },
};

export const AsAnchor: Story = {
  args: {
    href: "https://example.com",
    target: "_blank",
    default: "Enlace externo",
  },
};

export const IconVariants: Story = {
  render: () => ({
    components: { Btn, Icon },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
        <Btn variant="primary"><Icon name="plus" class="h-4 w-4" /> Crear</Btn>
        <Btn variant="secondary"><Icon name="search" class="h-4 w-4" /> Buscar</Btn>
        <Btn variant="outline"><Icon name="download" class="h-4 w-4" /> Exportar</Btn>
        <Btn variant="ghost"><Icon name="settings" class="h-4 w-4" /> Config</Btn>
        <Btn variant="danger"><Icon name="trash-2" class="h-4 w-4" /> Eliminar</Btn>
      </div>
    `,
  }),
};
