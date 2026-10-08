import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";
import Modal from "./Modal.vue";
import Btn from "./Btn.vue";

const meta: Meta<typeof Modal> = {
  title: "Design System/Modal",
  component: Modal,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl", "full"] },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

const render = (args: Record<string, unknown>) => ({
  components: { Modal, Btn },
  setup: () => ({ args, open: ref(true) }),
  template: `<div><Btn @click="open = true">Abrir modal</Btn>
    <Modal v-bind="args" :open="open" @close="open = false" @update:open="open = $event" /></div>`,
});

export const WithTitle: Story = {
  args: {
    open: true,
    title: "Confirmar acción",
    description: "Esta acción no se puede deshacer.",
  },
  render,
};
export const WithFooter: Story = {
  args: { open: true, title: "Guardar cambios", showDefaultFooter: true },
  render,
};
export const Large: Story = {
  args: { open: true, title: "Modal grande", size: "lg" },
  render,
};
