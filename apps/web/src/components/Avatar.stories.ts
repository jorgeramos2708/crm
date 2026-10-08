import type { Meta, StoryObj } from "@storybook/vue3";
import Avatar from "./Avatar.vue";

const meta: Meta<typeof Avatar> = {
  title: "Design System/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl", "2xl"] },
    status: {
      control: "select",
      options: ["online", "away", "busy", "offline"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {
  args: { name: "Ana García", status: "online" },
  render: (args) => ({
    components: { Avatar },
    setup: () => ({ args }),
    template: `<Avatar v-bind="args" />`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { Avatar },
    template: `<div style="display:flex;gap:8px;align-items:center">
      <Avatar name="Ana García" size="xs" /><Avatar name="Ana García" size="sm" />
      <Avatar name="Ana García" size="md" /><Avatar name="Ana García" size="lg" />
      <Avatar name="Ana García" size="xl" /><Avatar name="Ana García" size="2xl" /></div>`,
  }),
};
