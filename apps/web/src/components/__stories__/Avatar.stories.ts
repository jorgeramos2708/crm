import type { Meta, StoryObj } from "@storybook/vue3";
import Avatar from "../Avatar.vue";
import { User, Building2 } from "@lucide/vue";

const meta: Meta<typeof Avatar> = {
  title: "Core/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    src: {
      control: "text",
      description: "Image URL",
    },
    alt: {
      control: "text",
      description: "Alt text for image",
    },
    name: {
      control: "text",
      description: "Name for initials fallback",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
      description: "Avatar size",
    },
    status: {
      control: "select",
      options: ["online", "away", "busy", "offline"],
      description: "Status indicator",
    },
    shape: {
      control: "select",
      options: ["circle", "square"],
      description: "Avatar shape",
    },
    statusPosition: {
      control: "select",
      options: ["bottom-right", "top-right"],
      description: "Status badge position",
    },
    badge: {
      control: "text",
      description: "Notification badge text",
    },
    clickable: {
      control: "boolean",
      description: "Make avatar clickable",
    },
    defaultIcon: {
      control: "object",
      description: "Custom fallback icon",
    },
    fallbackColor: {
      control: "color",
      description: "Custom fallback background color",
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template:
        '<div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;"><story /></div>',
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    name: "Juan Pérez",
  },
};

export const WithImage: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    alt: "Avatar de Juan",
    name: "Juan Pérez",
  },
};

export const Sizes: Story = {
  render: () => ({
    components: { Avatar },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
        <Avatar name="Usuario" size="xs" />
        <Avatar name="Usuario" size="sm" />
        <Avatar name="Usuario" size="md" />
        <Avatar name="Usuario" size="lg" />
        <Avatar name="Usuario" size="xl" />
        <Avatar name="Usuario" size="2xl" />
      </div>
    `,
  }),
};

export const WithStatus: Story = {
  render: () => ({
    components: { Avatar },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
        <Avatar name="Usuario Online" status="online" />
        <Avatar name="Usuario Away" status="away" />
        <Avatar name="Usuario Busy" status="busy" />
        <Avatar name="Usuario Offline" status="offline" />
      </div>
    `,
  }),
};

export const WithBadge: Story = {
  args: {
    name: "Notificaciones",
    badge: "3",
    size: "lg",
  },
};

export const SquareShape: Story = {
  args: {
    name: "Empresa SA",
    shape: "square",
    size: "lg",
  },
};

export const CustomFallback: Story = {
  args: {
    fallbackColor: "#8b5cf6",
    defaultIcon: Building2,
    size: "xl",
  },
};

export const AllSizes: Story = {
  render: () => ({
    components: { Avatar },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;">
        <Avatar name="Usuario" size="xs" />
        <Avatar name="Usuario" size="sm" />
        <Avatar name="Usuario" size="md" />
        <Avatar name="Usuario" size="lg" />
        <Avatar name="Usuario" size="xl" />
        <Avatar name="Usuario" size="2xl" />
      </div>
    `,
  }),
};

export const WithFallbackIcon: Story = {
  args: {
    defaultIcon: User,
    size: "xl",
  },
};

export const Clickable: Story = {
  args: {
    name: "Perfil",
    clickable: true,
    size: "lg",
  },
};

export const TopRightStatus: Story = {
  args: {
    name: "Usuario Top-Right",
    status: "online",
    statusPosition: "top-right",
    size: "lg",
  },
};

export const CustomFallbackColor: Story = {
  render: () => ({
    components: { Avatar },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
        <Avatar fallbackColor="#ef4444" size="lg" />
        <Avatar fallbackColor="#3b82f6" size="lg" />
        <Avatar fallbackColor="#22c55e" size="lg" />
        <Avatar fallbackColor="#f59e0b" size="lg" />
        <Avatar fallbackColor="#8b5cf6" size="lg" />
      </div>
    `,
  }),
};
