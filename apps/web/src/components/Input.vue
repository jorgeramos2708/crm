<!-- Input (Premium): campo de texto con focus ring, label flotante, validación visual
  Props: type, multiline, label, placeholder, error, hint, icon, disabled, required
  Estados: default, focus, error, disabled, filled
  Accesibilidad: aria-describedby para error/hint, aria-invalid, aria-required -->
<template>
  <div class="input-wrapper" :class="wrapperClasses">
    <label
      v-if="label"
      :for="inputId"
      class="input-label"
      :class="{ 'label-floating': floatingLabel }"
    >
      {{ label }}
      <span v-if="required" class="text-destructive" aria-hidden="true">*</span>
    </label>

    <div class="input-group" :class="inputGroupClasses">
      <!-- Leading icon -->
      <div
        v-if="leadingIcon"
        class="input-icon leading"
        aria-hidden="true"
      >
        <component :is="leadingIcon" class="h-5 w-5" />
      </div>

      <!-- Input / Textarea -->
      <input
        v-if="!multiline"
        :id="inputId"
        :name="name || undefined"
        :type="type"
        :value="modelValue"
        :placeholder="floatingLabel ? '' : placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
        :aria-required="required"
        class="input-field"
        :class="fieldClasses"
        @input="handleInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <textarea
        v-else
        :id="inputId"
        :name="name || undefined"
        :value="modelValue"
        :placeholder="floatingLabel ? '' : placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
        :aria-required="required"
        class="input-field textarea"
        :class="fieldClasses"
        @input="handleInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />

      <!-- Trailing icon / clear button / password toggle -->
      <div v-if="trailingIcon || clearable || showPasswordToggle" class="input-icon trailing">
        <button
          v-if="showPasswordToggle"
          type="button"
          class="input-icon-btn"
          @click="togglePassword"
          :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          @mousedown.prevent
        >
          <component :is="showPassword ? 'eye-off' : 'eye'" class="h-5 w-5" />
        </button>
        <button
          v-else-if="clearable && modelValue"
          type="button"
          class="input-icon-btn"
          @click="clear"
          :aria-label="Limpiar"
          @mousedown.prevent
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <component v-else-if="trailingIcon" :is="trailingIcon" class="h-5 w-5" />
      </div>
    </div>

    <!-- Error / Hint message -->
    <div v-if="error || hint" class="input-message" :class="{ 'error': error, 'hint': !error }" role="alert" :id="messageId">
      <span v-if="error" class="flex items-center gap-1">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        {{ error }}
      </span>
      <span v-else>{{ hint }}</span>
    </div>

    <!-- Character counter -->
    <div v-if="maxLength && !multiline" class="input-counter" :class="{ 'near-limit': counterRatio > 0.8, 'at-limit': counterRatio >= 1 }">
      {{ modelValue?.length || 0 }} / {{ maxLength }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { Eye, EyeOff } from "@lucide/vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  name: { type: String, default: "" },
  type: { type: String, default: "text" },
  multiline: { type: Boolean, default: false },
  rows: { type: Number, default: 4 },
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  hint: { type: String, default: "" },
  error: { type: String, default: "" },
  leadingIcon: { type: Object, default: null },
  trailingIcon: { type: Object, default: null },
  clearable: { type: Boolean, default: false },
  showPasswordToggle: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  maxLength: { type: Number, default: 0 },
  floatingLabel: { type: Boolean, default: true },
  autocomplete: { type: String, default: "off" },
});

const emit = defineEmits(["update:modelValue", "focus", "blur", "keydown", "clear", "password-toggle"]);

const inputId = `input-${Math.random().toString(36).slice(2, 9)}`;
const messageId = `${inputId}-message`;

const focused = ref(false);
const showPassword = ref(false);
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

const fieldType = computed(() => (props.showPasswordToggle && showPassword.value ? "text" : props.type));
const floatingLabel = computed(() => props.floatingLabel && props.label && !props.multiline);

const describedBy = computed(() => {
  const ids = [];
  if (props.error) ids.push(messageId);
  if (props.hint && !props.error) ids.push(messageId);
  return ids.length ? ids.join(" ") : undefined;
});

const counterRatio = computed(() => {
  if (!props.maxLength) return 0;
  return (props.modelValue?.length || 0) / props.maxLength;
});

const wrapperClasses = computed(() => [
  "input-wrapper",
  { "has-label": !!props.label },
  { "floating": floatingLabel.value },
  { "focused": focused.value },
  { "has-error": !!props.error },
  { "disabled": props.disabled },
  { "filled": !!props.modelValue },
  { "floating-active": floatingLabel.value && (!!props.modelValue || focused.value) },
]);

const inputGroupClasses = computed(() => [
  "input-group",
  { "has-leading-icon": !!props.leadingIcon },
  { "has-trailing-icon": !!props.trailingIcon || props.clearable || props.showPasswordToggle },
]);

const fieldClasses = computed(() => [
  "input-field",
  { "has-error": !!props.error },
  { "focused": focused.value },
]);

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  emit("update:modelValue", target.value);
}

function onFocus(e: FocusEvent) {
  focused.value = true;
  emit("focus", e);
}

function onBlur(e: FocusEvent) {
  focused.value = false;
  emit("blur", e);
}

function onKeydown(e: KeyboardEvent) {
  emit("keydown", e);
}

function togglePassword() {
  showPassword.value = !showPassword.value;
  emit("password-toggle", showPassword.value);
  nextTick(() => inputRef.value?.focus());
}

function clear() {
  emit("update:modelValue", "");
  emit("clear");
  nextTick(() => inputRef.value?.focus());
}
</script>

<style scoped>
.input-wrapper {
  @apply w-full;
}

.input-label {
  @apply block text-sm font-medium text-[var(--fg)] mb-1.5 transition-all duration-fast ease-out;
  color: var(--fg);
}

.input-label.floating-label {
  @apply absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-muted)] pointer-events-none transition-all duration-fast ease-out;
  color: var(--fg-muted);
  transform-origin: left center;
  padding: 0 0.5rem;
  background: transparent;
}

.input-wrapper.floating-active .input-label.floating-label,
.input-wrapper.focused .input-label.floating-label {
  @apply -translate-y-[1.75rem] scale-85 text-[var(--brand)];
  color: var(--brand);
}

.input-wrapper.has-error .input-label.floating-label {
  color: var(--destructive);
}

.input-group {
  @apply relative flex items-center;
}

.input-icon {
  @apply flex items-center justify-center text-[var(--fg-muted)] pointer-events-none;
  width: 44px;
}

.input-icon.leading {
  @apply absolute left-0;
}

.input-icon.trailing {
  @apply absolute right-0;
}

.input-field {
  padding-left: 1rem;
  padding-right: 1rem;
}

.input-group.has-leading-icon .input-field {
  padding-left: 3rem;
}

.input-group.has-trailing-icon .input-field {
  padding-right: 3rem;
}

.input-icon-btn {
  @apply flex items-center justify-center w-11 h-full text-[var(--fg-muted)]
       hover:text-[var(--fg)] transition-colors duration-fast ease-out;
}

.input-icon-btn:focus-visible {
  @apply outline-none ring-2 ring-offset-2 ring-[var(--brand)];
}

.input-message {
  @apply mt-1.5 text-xs flex items-center gap-1 transition-opacity duration-fast ease-out;
}

.input-message.error {
  @apply text-[var(--destructive)];
}

.input-message.hint {
  @apply text-[var(--fg-muted)];
}

.input-counter {
  @apply mt-1.5 text-xs text-right text-[var(--fg-subtle)] transition-colors duration-fast ease-out;
}

.input-counter.near-limit {
  color: var(--warning);
}

.input-counter.at-limit {
  color: var(--destructive);
}

/* Floating label animations */
.input-wrapper {
  @apply relative;
}

.input-field {
  @apply w-full rounded-xl border bg-[var(--input-bg)] text-[var(--fg)]
         placeholder:text-[var(--fg-subtle)]
         focus:outline-none focus:ring-0;
  border-color: var(--input-border);
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
  font-family: inherit;
  background-color: var(--input-bg);
  color: var(--fg);
  transition: all var(--duration-normal) var(--ease-out);
}

.textarea {
  @apply input-field min-h-[100px] resize-y py-3;
}

.input-field::placeholder {
  color: var(--fg-subtle);
  transition: opacity var(--duration-fast) var(--ease-out);
}

.input-wrapper.floating-active .input-field::placeholder,
.input-wrapper.focused .input-field::placeholder {
  opacity: 0;
}

.input-field:focus-visible {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px var(--input-focus-ring);
}

.input-field:disabled {
  @apply opacity-50 pointer-events-none cursor-not-allowed;
}

.input-field.has-error {
  border-color: var(--destructive);
}

.input-field.has-error:focus-visible {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
}

.input-group {
  @apply relative flex items-center;
}

.input-icon {
  @apply flex items-center justify-center text-[var(--fg-muted)] pointer-events-none;
  width: 44px;
}

.input-icon.leading {
  @apply absolute left-0;
}

.input-icon.trailing {
  @apply absolute right-0;
}

.input-field {
  padding-left: 1rem;
  padding-right: 1rem;
}

.input-group.has-leading-icon .input-field {
  padding-left: 3rem;
}

.input-group.has-trailing-icon .input-field {
  padding-right: 3rem;
}

.input-icon-btn {
  @apply flex items-center justify-center w-11 h-full text-[var(--fg-muted)]
       hover:text-[var(--fg)] transition-colors duration-fast ease-out;
}

.input-icon-btn:focus-visible {
  @apply outline-none ring-2 ring-offset-2 ring-[var(--brand)];
}

.input-message {
  @apply mt-1.5 text-xs flex items-center gap-1 transition-opacity duration-fast ease-out;
}

.input-message.error {
  @apply text-[var(--destructive)];
}

.input-message.hint {
  @apply text-[var(--fg-muted)];
}

.input-counter {
  @apply mt-1.5 text-xs text-right text-[var(--fg-subtle)] transition-colors duration-fast ease-out;
}

.input-counter.near-limit {
  color: var(--warning);
}

.input-counter.at-limit {
  color: var(--destructive);
}

/* Floating label animations */
.input-wrapper {
  @apply relative;
}

.input-field {
  transition: border-color var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out),
              background-color var(--duration-normal) var(--ease-out);
}

.input-wrapper.focused .input-field {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px var(--input-focus-ring);
}

.input-wrapper.has-error .input-field {
  border-color: var(--destructive);
}

.input-wrapper.has-error .input-field:focus-visible {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
}

@media (prefers-reduced-motion: reduce) {
  .input-field,
  .input-label {
    transition: none !important;
  }
}
</style>