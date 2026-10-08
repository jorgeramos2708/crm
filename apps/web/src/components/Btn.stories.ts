import type { Meta, StoryObj } from "@storybook/vue3";
import Btn from "./Btn.vue";

const meta: Meta<typeof Btn> = {
  title: "Design System/Btn",
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
        "link-danger",
      ],
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
};

export default meta;
type Story = StoryObj<typeof Btn>;

const render =
  (label = "Botón") =>
  (args: Record<string, unknown>) => ({
    components: { Btn },
    setup: () => ({ args }),
    template: `<Btn v-bind="args">${label}</Btn>`,
  });

export const Primary: Story = {
  args: { variant: "primary" },
  render: render(),
};
export const Secondary: Story = {
  args: { variant: "secondary" },
  render: render(),
};
export const Outline: Story = {
  args: { variant: "outline" },
  render: render(),
};
export const Danger: Story = {
  args: { variant: "danger" },
  render: render("Eliminar"),
};
export const Loading: Story = {
  args: { variant: "primary", loading: true },
  render: render("Guardando"),
};
export const Sizes: Story = {
  render: () => ({
    components: { Btn },
    template: `<div style="display:flex;gap:8px;align-items:center">
      <Btn size="xs">XS</Btn><Btn size="sm">SM</Btn><Btn size="md">MD</Btn>
      <Btn size="lg">LG</Btn><Btn size="xl">XL</Btn></div>`,
  }),
};
