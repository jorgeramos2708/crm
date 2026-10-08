import type { Meta, StoryObj } from "@storybook/vue3";
import Badge from "../Badge.vue";

const meta: Meta<typeof Badge> = {
  title: "Core/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "success",
        "warning",
        "destructive",
        "info",
        "brand",
        "outline",
      ],
      description: "Semantic color variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Badge size",
    },
    dot: {
      control: "boolean",
      description: "Show status dot indicator",
    },
    removable: {
      control: "boolean",
      description: "Allow removing badge",
    },
    clickable: {
      control: "boolean",
      description: "Make badge clickable",
    },
    disabled: {
      control: "boolean",
      description: "Disable interactions",
    },
    color: {
      control: "color",
      description: "Custom hex color (overrides variant)",
    },
    hex: {
      control: "text",
      description: "Custom hex color for dot",
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template:
        '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;"><story /></div>',
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    default: "Badge por defecto",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    default: "Éxito",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    default: "Advertencia",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    default: "Error",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    default: "Información",
  },
};

export const Brand: Story = {
  args: {
    variant: "brand",
    default: "Marca",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    default: "Outline",
  },
};

export const Sizes: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
        <Badge size="sm">Small</Badge>
        <Badge size="md">Medium</Badge>
        <Badge size="lg">Large</Badge>
      </div>
    `,
  }),
};

export const WithDot: Story = {
  args: {
    variant: "success",
    dot: true,
    default: "En vivo",
  },
};

export const Removable: Story = {
  args: {
    variant: "brand",
    removable: true,
    default: "Etiqueta",
  },
};

export const Clickable: Story = {
  args: {
    variant: "info",
    clickable: true,
    default: "Clickeable",
  },
};

export const CustomColor: Story = {
  args: {
    color: "#8b5cf6",
    default: "Color personalizado",
  },
};

export const HexColor: Story = {
  args: {
    hex: "#f97316",
    dot: true,
    default: "Color hex",
  },
};

export const AllVariants: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    `,
  }),
};

export const PillVariants: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
        <Badge variant="success" size="md">Success</Badge>
        <Badge variant="warning" size="md">Warning</Badge>
        <Badge variant="destructive" size="md">Danger</Badge>
        <Badge variant="info" size="md">Info</Badge>
        <Badge variant="brand" size="md">Brand</Badge>
      </div>
    `,
  }),
};
