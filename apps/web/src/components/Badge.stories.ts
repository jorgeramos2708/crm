import type { Meta, StoryObj } from "@storybook/vue3";
import Badge from "./Badge.vue";

const meta: Meta<typeof Badge> = {
  title: "Design System/Badge",
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
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { variant: "default" },
  render: (args) => ({
    components: { Badge },
    setup: () => ({ args }),
    template: `<Badge v-bind="args">Etiqueta</Badge>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    components: { Badge },
    template: `<div style="display:flex;gap:8px;flex-wrap:wrap">
      <Badge variant="default">Default</Badge><Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge><Badge variant="destructive">Destructive</Badge>
      <Badge variant="info">Info</Badge><Badge variant="brand">Brand</Badge>
      <Badge variant="outline">Outline</Badge></div>`,
  }),
};

export const WithDot: Story = {
  args: { variant: "success", dot: true },
  render: (args) => ({
    components: { Badge },
    setup: () => ({ args }),
    template: `<Badge v-bind="args">En línea</Badge>`,
  }),
};
