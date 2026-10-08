import type { Meta, StoryObj } from "@storybook/vue3";
import Card from "./Card.vue";

const meta: Meta<typeof Card> = {
  title: "Design System/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["flat", "elevated", "interactive", "gradient", "glass"],
    },
    padding: {
      control: "select",
      options: ["none", "sm", "default", "lg", "xl"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Flat: Story = {
  args: { variant: "flat" },
  render: (args) => ({
    components: { Card },
    setup: () => ({ args }),
    template: `<Card v-bind="args"><template #header>Encabezado</template>
      Contenido de la tarjeta.<template #footer>Pie</template></Card>`,
  }),
};

export const Variants: Story = {
  render: () => ({
    components: { Card },
    template: `<div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
      <Card variant="flat">Flat</Card><Card variant="elevated">Elevated</Card>
      <Card variant="interactive" clickable>Interactive</Card>
      <Card variant="gradient">Gradient</Card><Card variant="glass">Glass</Card></div>`,
  }),
};
