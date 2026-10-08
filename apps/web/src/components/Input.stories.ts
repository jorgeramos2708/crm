import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";
import Input from "./Input.vue";

const meta: Meta<typeof Input> = {
  title: "Design System/Input",
  component: Input,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

const render = (args: Record<string, unknown>) => ({
  components: { Input },
  setup: () => ({ args, value: ref((args.modelValue as string) ?? "") }),
  template: `<Input v-bind="args" v-model="value" />`,
});

export const Default: Story = {
  args: { label: "Nombre", name: "nombre", placeholder: "Escribe tu nombre" },
  render,
};
export const WithHint: Story = {
  args: {
    label: "Correo",
    name: "email",
    type: "email",
    placeholder: "nombre@empresa.com",
    hint: "Nunca lo compartiremos",
  },
  render,
};
export const WithError: Story = {
  args: {
    label: "Correo",
    name: "email",
    modelValue: "no-es-un-email",
    error: "Formato de correo inválido",
  },
  render,
};
export const Multiline: Story = {
  args: {
    label: "Descripción",
    name: "descripcion",
    multiline: true,
    rows: 4,
    placeholder: "Detalles…",
  },
  render,
};
export const Password: Story = {
  args: {
    label: "Contraseña",
    name: "password",
    type: "password",
    showPasswordToggle: true,
  },
  render,
};
