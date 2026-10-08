import type { Meta, StoryObj } from "@storybook/vue3";
import Input from "../Input.vue";
import { Eye, EyeOff, Search, User, Mail, Lock } from "@lucide/vue";

const meta: Meta<typeof Input> = {
  title: "Core/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
      description: "HTML input type",
    },
    multiline: {
      control: "boolean",
      description: "Render as textarea",
    },
    label: {
      control: "text",
      description: "Label text",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    hint: {
      control: "text",
      description: "Helper text below input",
    },
    error: {
      control: "text",
      description: "Error message",
    },
    leadingIcon: {
      control: "object",
      description: "Leading icon component",
    },
    trailingIcon: {
      control: "object",
      description: "Trailing icon component",
    },
    clearable: {
      control: "boolean",
      description: "Show clear button",
    },
    showPasswordToggle: {
      control: "boolean",
      description: "Show password visibility toggle",
    },
    disabled: {
      control: "boolean",
      description: "Disable input",
    },
    required: {
      control: "boolean",
      description: "Mark as required",
    },
    maxLength: {
      control: "number",
      description: "Maximum character count",
    },
    floatingLabel: {
      control: "boolean",
      description: "Enable floating label animation",
    },
    rows: {
      control: "number",
      description: "Textarea rows (multiline only)",
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="max-width: 400px;"><story /></div>',
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: "Nombre",
    placeholder: "Escribe tu nombre",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Correo electrónico",
    placeholder: "correo@ejemplo.com",
    type: "email",
    hint: "Usaremos este correo para notificaciones",
  },
};

export const WithError: Story = {
  args: {
    label: "Contraseña",
    type: "password",
    placeholder: "••••••••",
    error: "La contraseña debe tener al menos 8 caracteres",
    value: "123",
  },
};

export const WithHint: Story = {
  args: {
    label: "Teléfono",
    placeholder: "+34 600 000 000",
    hint: "Incluye el código de país",
  },
};

export const WithLeadingIcon: Story = {
  args: {
    label: "Buscar",
    placeholder: "Buscar contactos...",
    leadingIcon: Search,
  },
};

export const WithTrailingIcon: Story = {
  args: {
    label: "Usuario",
    placeholder: "Nombre de usuario",
    trailingIcon: User,
  },
};

export const WithClearable: Story = {
  args: {
    label: "Email",
    type: "email",
    placeholder: "correo@ejemplo.com",
    clearable: true,
    value: "usuario@ejemplo.com",
  },
};

export const PasswordToggle: Story = {
  args: {
    label: "Contraseña",
    type: "password",
    placeholder: "••••••••",
    showPasswordToggle: true,
    value: "secreto123",
  },
};

export const Disabled: Story = {
  args: {
    label: "Campo deshabilitado",
    placeholder: "No editable",
    disabled: true,
    value: "Valor fijo",
  },
};

export const Required: Story = {
  args: {
    label: "Campo obligatorio",
    placeholder: "Este campo es requerido",
    required: true,
  },
};

export const WithMaxLength: Story = {
  args: {
    label: "Bio",
    placeholder: "Cuéntanos sobre ti (máx 160 caracteres)",
    maxLength: 160,
    multiline: true,
    rows: 4,
  },
};

export const Textarea: Story = {
  args: {
    label: "Comentarios",
    placeholder: "Escribe tu comentario...",
    multiline: true,
    rows: 4,
    hint: "Máximo 500 caracteres",
    maxLength: 500,
  },
};

export const FloatingLabel: Story = {
  args: {
    label: "Correo",
    placeholder: "correo@ejemplo.com",
    type: "email",
    floatingLabel: true,
  },
};

export const WithAutocomplete: Story = {
  args: {
    label: "Correo",
    type: "email",
    placeholder: "correo@ejemplo.com",
    autocomplete: "email",
  },
};

export const FormExample: Story = {
  render: () => ({
    components: { Input },
    template: `
      <form class="space-y-4" style="max-width: 400px;">
        <Input label="Nombre completo" placeholder="Juan Pérez" required />
        <Input label="Correo" type="email" placeholder="correo@ejemplo.com" required />
        <Input label="Teléfono" placeholder="+34 600 000 000" hint="Incluye código de país" />
        <Input label="Contraseña" type="password" placeholder="••••••••" showPasswordToggle required />
        <Input label="Confirmar contraseña" type="password" placeholder="••••••••" showPasswordToggle required />
        <Input label="Bio" placeholder="Cuéntanos sobre ti" multiline rows="3" maxLength=200 />
        <div class="pt-4">
          <button type="submit" class="w-full btn btn-primary">Registrarse</button>
        </div>
      </form>
    `,
  }),
};
