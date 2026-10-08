<template>
  <div class="login-page">
    <!-- Background Layer -->
    <div class="login-bg" :style="fondoSolido ? { backgroundColor: fondoSolido } : {}">
      <img
        v-if="fondoFoto"
        :src="fondoFoto"
        alt=""
        class="login-bg-image"
      />
      <template v-if="!fondoFoto && !fondoSolido">
        <div class="login-gradient-orb orb-1" />
        <div class="login-gradient-orb orb-2" />
      </template>
      <div class="login-overlay" />
    </div>

    <!-- Foreground Content -->
    <div class="login-foreground">
      <div class="login-main">
        <!-- Brand Header -->
        <header class="login-header">
          <div v-if="marca.logo" class="login-logo-container">
            <img :src="marca.logo" :alt="marca.nombre" class="login-logo" />
          </div>
          <div v-else class="login-logo-fallback">
            <span class="login-logo-mark">{{ (marca.nombre || "C").charAt(0).toUpperCase() }}</span>
          </div>
          <h1 class="login-brand-name">{{ marca.nombre }}<span class="login-brand-suffix"> CRM</span></h1>
          <p class="login-tagline">Inicia sesión para continuar</p>
        </header>

        <!-- Login Card -->
        <div class="login-card" :class="{ 'login-card-error': error }">
          <div v-if="error" class="login-alert" role="alert">
            <Icon name="alert-circle" class="h-4 w-4 flex-shrink-0" />
            <span>{{ error }}</span>
          </div>

          <form @submit.prevent="handleSubmit" class="login-form" novalidate>
            <!-- Email Field -->
            <div class="form-group">
              <label for="email" class="form-label">Correo electrónico</label>
              <div class="form-input-wrapper">
                <svg class="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email"
                  name="email"
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="nombre@empresa.com"
                  class="form-input"
                  :class="{ 'form-input-error': error && !email }"
                  @blur="validateEmail"
                  @input="clearEmailError"
                />
              </div>
              <p v-if="emailError" class="form-error" id="email-error">{{ emailError }}</p>
            </div>

            <!-- Password Field -->
            <div class="form-group">
              <div class="form-label-row">
                <label for="password" class="form-label">Contraseña</label>
                <a href="#" class="form-forgot" @click.prevent="forgotPassword">¿Olvidaste tu contraseña?</a>
              </div>
              <div class="form-input-wrapper">
                <svg class="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  name="password"
                  v-model="password"
                  :type="verPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="form-input"
                  :class="{ 'form-input-error': error && !password }"
                  @blur="validatePassword"
                  @input="clearPasswordError"
                />
                <button
                  type="button"
                  class="form-input-toggle"
                  @click="verPassword = !verPassword"
                  @mousedown.prevent
                  :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <component :is="verPassword ? 'eye-off' : 'eye'" class="h-5 w-5" />
                </button>
              </div>
              <p v-if="passwordError" class="form-error" id="password-error">{{ passwordError }}</p>
            </div>

            <!-- Remember Me & Submit -->
            <div class="form-footer">
              <label class="form-checkbox">
                <input type="checkbox" v-model="rememberMe" class="checkbox-input" />
                <span class="checkbox-box">
                  <svg v-if="rememberMe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="h-4 w-4">
                    <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="checkbox-label">Recordarme</span>
              </label>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="login-submit"
            >
              <span v-if="loading" class="btn-loading">
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Iniciando sesión...</span>
              </span>
              <span v-else class="btn-content">
                <span>Iniciar sesión</span>
                <Icon name="arrow-right" class="h-4 w-4" />
              </span>
            </button>
          </form>

          <!-- Divider -->
          <div class="login-divider">
            <span>O continuar con</span>
          </div>

          <!-- SSO Buttons -->
          <div class="login-sso">
            <button
              type="button"
              @click="sso('google')"
              :disabled="loading"
              class="sso-btn sso-google"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              @click="sso('microsoft')"
              :disabled="loading"
              class="sso-btn sso-microsoft"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" rx="2" />
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00" rx="2" />
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF" rx="2" />
                <rect x="13" y="13" width="10" height="10" fill="#FFB900" rx="2" />
              </svg>
              Microsoft
            </button>
          </div>
        </div>

        <!-- Footer -->
        <footer class="login-footer">
          <p>¿No tienes cuenta? <a href="#" class="footer-link">Contacta a tu administrador</a></p>
          <p class="version">v1.0.0</p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { marca, loadMarca } from "../utils/marca";
import { toast } from "../utils/toast";
import { Eye, EyeOff, AlertCircle } from "@lucide/vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const fondoFoto = computed(() => {
  if (marca.value.fondo && marca.value.fondo.startsWith("data:"))
    return marca.value.fondo;
  return "";
});
const fondoSolido = computed(() => {
  const f = marca.value.fondo || "";
  return /^#[0-9a-fA-F]{6}$/.test(f) ? f : "";
});

const email = ref("");
const password = ref("");
const verPassword = ref(false);
const loading = ref(false);
const error = ref(null);
const rememberMe = ref(false);

// Validation
const emailError = ref("");
const passwordError = ref("");

const ERRORES_SSO = {
  sso_cancelado: "Cancelaste el inicio de sesión.",
  sso_invalido: "Sesión de SSO inválida, inténtalo de nuevo.",
  sso_expirado: "La sesión de SSO expiró, inténtalo de nuevo.",
  sso_no_configurado: "El proveedor no está configurado. Avisa a tu administrador.",
  sso_sin_cuenta: "No hay cuenta con ese correo. Pide a tu administrador que te dé de alta.",
  sso_inactivo: "Tu cuenta está inactiva. Contacta a tu administrador.",
  sso_sin_email: "No se pudo leer tu correo. Inténtalo de nuevo.",
  sso_error: "Error iniciando sesión. Inténtalo de nuevo.",
};

function validateEmail() {
  if (!email.value) {
    emailError.value = "El correo es obligatorio";
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = "Formato de correo inválido";
    return false;
  }
  emailError.value = "";
  return true;
}

function validatePassword() {
  if (!password.value) {
    passwordError.value = "La contraseña es obligatoria";
    return false;
  }
  if (password.value.length < 6) {
    passwordError.value = "La contraseña debe tener al menos 6 caracteres";
    return false;
  }
  passwordError.value = "";
  return true;
}

function clearEmailError() {
  if (emailError.value) emailError.value = "";
}

function clearPasswordError() {
  if (passwordError.value) passwordError.value = "";
}

function forgotPassword() {
  // TODO: Implementar recuperación de contraseña
  toast.info("Contacta a tu administrador para restablecer tu contraseña");
}

const handleSubmit = async () => {
  const validEmail = validateEmail();
  const validPassword = validatePassword();

  if (!validEmail || !validPassword) return;

  error.value = null;
  loading.value = true;

  try {
    const success = await authStore.login(email.value, password.value, rememberMe.value);
    if (success) {
      router.push("/");
    } else {
      error.value = authStore.error || "Credenciales inválidas";
    }
  } catch (e) {
    console.error("Login error:", e);
    error.value = "Error de conexión. Inténtalo de nuevo.";
  } finally {
    loading.value = false;
  }
};

const sso = (proveedor) => {
  window.location.href = `/api/auth/${proveedor}/login`;
};

onMounted(async () => {
  loadMarca();
  if (route.query.error) {
    error.value = ERRORES_SSO[route.query.error] || "Error iniciando sesión.";
  }
  if (authStore.isAuthenticated || (await authStore.checkAuth())) {
    router.push("/");
  }
});

// Clear error when user starts typing
watch(email, () => { if (error.value) error.value = null; });
watch(password, () => { if (error.value) error.value = null; });
</script>

<style scoped>
/* ============================================================
   LOGIN PAGE - Premium Brand Experience
   ============================================================ */

.login-page {
  @apply relative min-h-screen w-full flex items-center justify-center overflow-hidden;
}

/* Background */
.login-bg {
  @apply absolute inset-0 bg-[var(--bg)];
  background: linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 60%, black) 100%);
}

.login-bg-image {
  @apply h-full w-full object-cover opacity-20;
}

.login-gradient-orb {
  @apply absolute rounded-full opacity-30 blur-3xl;
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
}

.orb-1 {
  @apply -left-32 -top-32 h-80 w-80;
  animation: orb-float 20s ease-in-out infinite;
}

.orb-2 {
  @apply -right-32 -bottom-32 h-96 w-96;
  animation: orb-float 25s ease-in-out infinite reverse;
}

.login-overlay {
  @apply absolute inset-0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.9) 100%);
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -20px) scale(1.05); }
  50% { transform: translate(-20px, 30px) scale(0.95); }
  75% { transform: translate(20px, 20px) scale(1.02); }
}

@media (prefers-reduced-motion: reduce) {
  .login-gradient-orb { animation: none !important; }
}

/* Foreground */
.login-foreground {
  @apply relative z-10 w-full max-w-md px-4 py-12;
}

.login-main {
  @apply w-full;
}

/* Header */
.login-header {
  @apply text-center mb-10;
  animation: slide-up var(--duration-slower) var(--ease-out);
}

.login-logo-container,
.login-logo-fallback {
  @apply inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4;
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
}

.login-logo {
  @apply w-full h-full object-cover rounded-xl;
}

.login-logo-fallback {
  @apply text-[var(--brand-fg)] font-bold text-2xl;
}

.login-logo-mark {
  @apply text-3xl;
}

.login-brand-name {
  @apply text-4xl font-extrabold tracking-tight mb-1 text-white;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45);
}

.login-brand-suffix {
  @apply font-light tracking-[0.18em] text-white/85;
}

.login-tagline {
  @apply text-base text-white/70;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);
}

/* Card */
.login-card {
  @apply relative rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
         shadow-2xl border p-8;
  border-color: var(--card-border);
  animation: scale-in var(--duration-slower) var(--ease-spring);
  animation-delay: 200ms;
  animation-fill-mode: both;
}

html.dark .login-card {
  background: rgba(17, 24, 39, 0.95);
  border-color: var(--card-border);
}

.login-card-error {
  animation: shake 0.4s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

/* Alert */
.login-alert {
  @apply flex items-center gap-2 p-3 rounded-xl mb-6 text-sm
         bg-[var(--destructive-bg)] text-[var(--destructive)] border;
  border-color: var(--destructive);
  animation: slide-down var(--duration-fast) var(--ease-out);
}

/* Form */
.login-form {
  @apply space-y-5;
}

.form-group {
  @apply space-y-1.5;
}

.form-label-row {
  @apply flex items-center justify-between;
}

.form-label {
  @apply text-sm font-medium text-[var(--fg)];
}

.form-forgot {
  @apply text-sm text-[var(--brand)] hover:underline transition-colors;
}

.form-input-wrapper {
  @apply relative;
}

.form-input-icon {
  @apply absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-muted)] pointer-events-none transition-colors;
}

.form-input {
  @apply w-full rounded-xl border bg-white dark:bg-zinc-800 px-4 py-3 pl-12 pr-12
         text-[var(--fg)] placeholder:text-[var(--fg-subtle)]
         outline-none transition-all duration-150 ease-out;
  border-color: var(--input-border);
  font-size: var(--text-base);
  font-family: inherit;
}

.form-input:focus {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px var(--input-focus-ring);
}

.form-input:focus + .form-input-icon,
.form-input:not(:placeholder-shown) + .form-input-icon {
  color: var(--brand);
}

.form-input-error {
  border-color: var(--destructive) !important;
}

.form-input-error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
}

.form-input-toggle {
  @apply absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--fg-muted)]
         hover:text-[var(--fg)] transition-colors;
}

.form-error {
  @apply text-sm text-[var(--destructive)] flex items-center gap-1;
  animation: fade-in var(--duration-fast) var(--ease-out);
}

.form-footer {
  @apply flex items-center justify-between;
}

.form-checkbox {
  @apply flex items-center gap-2 cursor-pointer;
}

.checkbox-input {
  @apply sr-only;
}

.checkbox-box {
  @apply relative flex items-center justify-center w-5 h-5 rounded-lg
         border transition-all duration-150 ease-out;
  border-color: var(--input-border);
  background: var(--input-bg);
}

.checkbox-box svg {
  @apply text-[var(--brand-fg)];
  color: var(--brand-fg);
}

.form-checkbox:hover .checkbox-box {
  border-color: var(--brand);
}

.form-checkbox:has(:focus-visible) .checkbox-box {
  @apply ring-2 ring-offset-2;
  --tw-ring-color: var(--brand);
}

.checkbox-label {
  @apply text-sm text-[var(--fg-muted)];
}

/* Submit Button */
.login-submit {
  @apply w-full rounded-xl py-3.5 px-4 font-semibold text-base
         transition-all duration-200 ease-out focus-ring
         disabled:opacity-50 disabled:pointer-events-none;
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
  color: var(--brand-fg);
  box-shadow: var(--shadow-brand-sm);
  border: none;
}

.login-submit:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: var(--shadow-brand-md);
  transform: translateY(-1px);
}

.login-submit:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-loading {
  @apply flex items-center justify-center gap-2;
}

.btn-content {
  @apply flex items-center justify-center gap-2;
}

/* Divider */
.login-divider {
  @apply my-6 flex items-center gap-3;
}

.login-divider::before,
.login-divider::after {
  content: '';
  @apply h-px flex-1;
  background: var(--card-border);
}

.login-divider span {
  @apply text-xs text-[var(--fg-muted)] bg-transparent px-0;
}

/* SSO Buttons */
.login-sso {
  @apply grid grid-cols-2 gap-3;
}

.sso-btn {
  @apply flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5
         text-sm font-medium text-[var(--fg)] transition-all duration-150 ease-out
         disabled:opacity-50 disabled:pointer-events-none focus-ring;
  border-color: var(--card-border);
  background: var(--bg);
}

.sso-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--fg-muted);
  transform: translateY(-1px);
}

.sso-google:focus-visible { --tw-ring-color: #4285F4; }
.sso-microsoft:focus-visible { --tw-ring-color: #00A4EF; }

/* Footer */
.login-footer {
  @apply mt-8 text-center space-y-2;
}

.login-footer p {
  @apply text-sm text-[var(--fg-muted)];
}

.footer-link {
  @apply text-[var(--brand)] hover:underline font-medium;
}

.version {
  @apply text-xs text-[var(--fg-subtle)];
}

/* Animations */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .login-header,
  .login-card,
  .login-alert {
    animation: none !important;
  }
}
</style>