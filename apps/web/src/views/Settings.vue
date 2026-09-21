<template>
  <div class="p-6 max-w-4xl">
    <header class="mb-6">
      <p class="text-sm text-zinc-500">Conexiones e integraciones del CRM</p>
    </header>

    <div
      v-if="banner"
      :class="
        bannerOk
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      "
      class="mb-4 px-4 py-3 rounded-lg border text-sm"
    >
      {{ banner }}
    </div>

    <!-- Administración (admin) -->
    <div
      v-if="authStore.user?.role === 'admin'"
      class="panel-flat mb-3 overflow-hidden"
    >
      <button
        @click="adminOpen = !adminOpen"
        class="flex w-full items-center gap-3 p-5 text-left"
      >
        <Icon name="admin" class="h-5 w-5 text-zinc-500" />
        <span class="flex-1">
          <span class="block font-semibold">Administración</span>
          <span class="block text-xs text-zinc-400 dark:text-zinc-300"
            >Usuarios, equipos y permisos</span
          >
        </span>
        <svg
          class="h-4 w-4 text-zinc-400 transition-transform"
          :class="adminOpen ? '' : '-rotate-90'"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="adminOpen" class="px-5 pb-5 space-y-3">
        <!-- Usuarios y permisos (admin) -->
        <div
          v-if="authStore.user?.role === 'admin'"
          class="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        >
          <button
            @click="acordeon = acordeon === 'usuarios' ? '' : 'usuarios'"
            class="flex w-full items-center gap-3 p-5 text-left"
          >
            <Icon name="usuarios" class="h-5 w-5 text-zinc-500" />
            <span class="flex-1">
              <span class="block font-semibold">Usuarios</span>
              <span class="block text-xs text-zinc-500"
                >Cuentas y permisos de lectura, escritura y borrado</span
              >
            </span>
            <svg
              class="h-4 w-4 text-zinc-400 transition-transform"
              :class="acordeon === 'usuarios' ? '' : '-rotate-90'"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div v-show="acordeon === 'usuarios'" class="px-5 pb-5">
            <div class="flex items-center justify-end mb-4">
              <button
                @click="openUserModal(null)"
                class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
              >
                + Nuevo Usuario
              </button>
            </div>
            <ul class="divide-y divide-zinc-200 dark:divide-zinc-700 mb-4">
              <li v-for="u in usuarios" :key="u.id" class="py-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm">
                    <span class="font-medium">{{ u.name }}</span>
                    <span class="text-zinc-500">
                      · {{ u.email }} · {{ u.role
                      }}{{ u.activo ? "" : " · inactivo" }}</span
                    >
                  </div>
                  <div class="flex gap-2 text-xs">
                    <button
                      @click="editarPermisos(u)"
                      class="text-blue-600 hover:underline"
                    >
                      Permisos
                    </button>
                    <button
                      @click="openUserModal(u)"
                      class="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      @click="borrarUsuario(u)"
                      class="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div
                  v-if="permUser?.id === u.id"
                  class="mt-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-3"
                >
                  <div
                    class="grid grid-cols-[1fr_repeat(3,auto)] gap-x-4 gap-y-1.5 items-center text-sm"
                  >
                    <span class="text-xs uppercase tracking-wide text-zinc-500"
                      >Módulo</span
                    >
                    <span
                      class="text-xs font-medium text-center w-8"
                      title="Leer"
                      >R</span
                    >
                    <span
                      class="text-xs font-medium text-center w-8"
                      title="Escribir"
                      >W</span
                    >
                    <span
                      class="text-xs font-medium text-center w-8"
                      title="Borrar"
                      >X</span
                    >
                    <template v-for="m in modulos" :key="m">
                      <span>{{ m }}</span>
                      <input
                        type="checkbox"
                        v-model="permMap[m].r"
                        class="w-4 h-4 justify-self-center"
                      />
                      <input
                        type="checkbox"
                        v-model="permMap[m].w"
                        class="w-4 h-4 justify-self-center"
                      />
                      <input
                        type="checkbox"
                        v-model="permMap[m].x"
                        class="w-4 h-4 justify-self-center"
                      />
                    </template>
                  </div>
                  <div class="flex gap-2 mt-3">
                    <button
                      @click="guardarPermisos"
                      class="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium"
                    >
                      Guardar permisos
                    </button>
                    <button
                      @click="permUser = null"
                      class="px-4 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-xs"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </li>
              <li v-if="!usuarios.length" class="py-2 text-sm text-zinc-500">
                Sin usuarios.
              </li>
            </ul>
          </div>
        </div>
        <!-- Equipos (admin) -->
        <div
          v-if="authStore.user?.role === 'admin'"
          class="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        >
          <button
            @click="acordeon = acordeon === 'equipos' ? '' : 'equipos'"
            class="flex w-full items-center gap-3 p-5 text-left"
          >
            <Icon name="equipo" class="h-5 w-5 text-zinc-500" />
            <span class="flex-1">
              <span class="block font-semibold">Equipos</span>
              <span class="block text-xs text-zinc-500"
                >Agrupa usuarios para filtrar por alcance</span
              >
            </span>
            <svg
              class="h-4 w-4 text-zinc-400 transition-transform"
              :class="acordeon === 'equipos' ? '' : '-rotate-90'"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div v-show="acordeon === 'equipos'" class="px-5 pb-5">
            <form @submit.prevent="crearEquipo" class="flex gap-2 mb-4">
              <Input
                v-model="eqNombre"
                type="text"
                required
                placeholder="Nombre del equipo"
                class="flex-1"
              />
              <button
                type="submit"
                class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
              >
                Crear
              </button>
            </form>
            <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
              <li v-for="eq in equipos" :key="eq.id" class="py-3">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-sm"
                    >{{ eq.nombre }}
                    <span class="text-zinc-500"
                      >({{ (eq.miembros || []).length }})</span
                    ></span
                  >
                  <button
                    @click="borrarEquipo(eq)"
                    class="text-red-600 hover:underline text-xs"
                  >
                    Eliminar
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5 mt-2">
                  <span
                    v-for="m in eq.miembros || []"
                    :key="m.userId"
                    class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700"
                  >
                    {{ m.name }}
                    <button
                      @click="quitarMiembro(eq, m)"
                      class="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                </div>
                <div class="flex gap-2 mt-2">
                  <select
                    v-model="eqAdd[eq.id]"
                    class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-xs"
                  >
                    <option value="">Añadir miembro...</option>
                    <option v-for="u in usuarios" :key="u.id" :value="u.id">
                      {{ u.name }} ({{ u.email }})
                    </option>
                  </select>
                  <button
                    @click="agregarMiembro(eq)"
                    :disabled="!eqAdd[eq.id]"
                    class="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 text-xs disabled:opacity-50"
                  >
                    Añadir
                  </button>
                </div>
              </li>
              <li v-if="!equipos.length" class="py-2 text-sm text-zinc-500">
                Sin equipos.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="authStore.user?.role === 'admin'"
      class="panel-flat mb-3 overflow-hidden"
    >
      <button
        @click="acordeon = acordeon === 'marca' ? '' : 'marca'"
        class="flex w-full items-center gap-3 p-5 text-left"
      >
        <Icon name="marca" class="h-5 w-5 text-zinc-500" />
        <span class="flex-1">
          <span class="block font-semibold">Personalización de CRM</span>
          <span class="block text-xs text-zinc-500"
            >Tema, nombre, logo y colores de este despliegue</span
          >
        </span>
        <svg
          class="h-4 w-4 text-zinc-400 transition-transform"
          :class="acordeon === 'marca' ? '' : '-rotate-90'"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="acordeon === 'marca'" class="px-5 pb-5">
        <form @submit.prevent="guardarMarca" class="space-y-4">
          <Field label="Nombre del espacio">
            <Input
              v-model="marcaForm.nombre"
              type="text"
              maxlength="60"
              placeholder="CRM"
              class="w-full"
            />
          </Field>
          <div>
            <label class="block text-sm mb-1">Tema general del CRM</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <button
                v-for="t in temasPreset"
                :key="t.nombre"
                type="button"
                @click="aplicarTema(t)"
                class="flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs"
                :class="
                  temaActivo(t)
                    ? 'border-zinc-900 dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-700'
                "
                :title="t.nombre"
              >
                <span class="flex -space-x-1">
                  <span
                    class="h-5 w-5 rounded-full border border-zinc-300"
                    :style="{ backgroundColor: t.fondo }"
                  ></span>
                  <span
                    class="h-5 w-5 rounded-full border border-zinc-300"
                    :style="{ backgroundColor: t.panel }"
                  ></span>
                  <span
                    class="h-5 w-5 rounded-full border border-zinc-300"
                    :style="{ backgroundColor: t.primario }"
                  ></span>
                </span>
                {{ t.nombre }}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex items-center gap-2">
                <input
                  v-model="marcaForm.temaFondo"
                  type="color"
                  class="h-9 w-12 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 p-1"
                />
                <span class="text-xs text-zinc-500">Fondo</span>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="marcaForm.temaPanel"
                  type="color"
                  class="h-9 w-12 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 p-1"
                />
                <span class="text-xs text-zinc-500">Paneles</span>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1"
              >Color de los módulos del menú</label
            >
            <div class="flex items-center gap-3">
              <input
                v-model="marcaForm.color"
                type="color"
                class="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 p-1"
              />
              <div class="flex gap-1.5">
                <button
                  v-for="c in [
                    '#1c1917',
                    '#0F6CBD',
                    '#047857',
                    '#B45309',
                    '#9D174D',
                  ]"
                  :key="c"
                  type="button"
                  @click="marcaForm.color = c"
                  class="h-7 w-7 rounded-full border border-zinc-300"
                  :style="{ backgroundColor: c }"
                  :title="c"
                ></button>
              </div>
              <button
                type="button"
                @click="marcaForm.color = ''"
                class="text-xs text-zinc-500 hover:underline"
              >
                Restablecer
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1"
              >Logo (PNG/JPG, máx. 500 KB)</label
            >
            <div class="flex items-center gap-3">
              <img
                v-if="marcaLogoPreview"
                :src="marcaLogoPreview"
                alt="logo"
                class="h-12 w-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
              />
              <label
                class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Elegir archivo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  @change="elegirLogo"
                />
              </label>
              <button
                v-if="marcaLogoPreview"
                type="button"
                @click="quitarLogo"
                class="text-xs text-red-600 hover:underline"
              >
                Quitar
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1">Fondo del inicio de sesión</label>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="f in fondosPreset"
                :key="f.valor || 'def'"
                type="button"
                @click="
                  marcaForm.fondo = f.valor;
                  marcaFondoPreview = '';
                "
                class="h-10 w-16 rounded-lg border-2 overflow-hidden"
                :class="
                  marcaForm.fondo === f.valor && !marcaFondoPreview
                    ? 'border-zinc-900 dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-700'
                "
                :title="f.nombre"
              >
                <span class="block h-full w-full" :style="f.estilo"></span>
              </button>
              <label
                class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                Subir imagen
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  @change="elegirFondo"
                />
              </label>
              <button
                v-if="fondoActualPreview"
                type="button"
                @click="quitarFondo"
                class="text-xs text-red-600 hover:underline"
              >
                Restablecer
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="submit"
              :disabled="saving"
              class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {{ saving ? "Guardando..." : "Guardar" }}
            </button>
            <button
              type="button"
              @click="showPreview = true"
              class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Previsualización
            </button>
            <span v-if="marcaMsg" class="text-sm text-zinc-500">{{
              marcaMsg
            }}</span>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showPreview"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showPreview = false"
    >
      <div class="w-full max-w-sm overflow-hidden rounded-2xl">
        <div
          class="relative flex min-h-[480px] items-center justify-center p-6"
          :style="previewFondoStyle"
        >
          <div class="absolute inset-0 bg-white/40"></div>
          <div class="relative w-full rounded-2xl bg-white p-6 shadow-xl">
            <div class="mb-4 text-center">
              <img
                v-if="marcaLogoPreview"
                :src="marcaLogoPreview"
                alt="logo"
                class="mx-auto mb-2 h-10 w-10 rounded-xl object-cover"
              />
              <p class="text-xs font-semibold tracking-[0.2em] text-zinc-500">
                {{ previewNombre }}
              </p>
              <h3 class="mt-1 text-xl font-bold">Inicio de Sesión</h3>
            </div>
            <div class="space-y-3">
              <div
                class="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-400"
              >
                nombre@empresa.com
              </div>
              <div
                class="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-400"
              >
                ••••••••••
              </div>
              <div
                class="rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white"
                :style="previewBtnStyle"
                :class="{ 'bg-zinc-900': !marcaForm.color }"
              >
                Iniciar Sesión
              </div>
            </div>
            <p class="mt-3 text-center text-[11px] text-zinc-400">
              Vista previa sin guardar
            </p>
          </div>
        </div>
        <button
          @click="showPreview = false"
          class="w-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Cerrar
        </button>
      </div>
    </div>

    <div class="panel-flat mb-3 overflow-hidden">
      <button
        @click="acordeon = acordeon === 'conexiones' ? '' : 'conexiones'"
        class="flex w-full items-center gap-3 p-5 text-left"
      >
        <Icon name="conexiones" class="h-5 w-5 text-zinc-500" />
        <span class="flex-1">
          <span class="block font-semibold">Conexiones</span>
          <span class="block text-xs text-zinc-500"
            >Buzones de Outlook y Gmail</span
          >
        </span>
        <svg
          class="h-4 w-4 text-zinc-400 transition-transform"
          :class="acordeon === 'conexiones' ? '' : '-rotate-90'"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="acordeon === 'conexiones'" class="px-5 pb-5 space-y-4">
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <h3 class="font-semibold mb-3">Outlook / Microsoft 365</h3>

          <div v-if="status?.connected" class="space-y-3">
            <div class="flex items-center gap-2 text-sm">
              <span
                class="inline-block w-2.5 h-2.5 rounded-full bg-green-500"
              ></span>
              <span class="font-medium"
                >Conectado{{
                  profile
                    ? ` como ${profile.displayName || profile.mail || profile.userPrincipalName}`
                    : ""
                }}</span
              >
            </div>
            <p v-if="status.expiresAt" class="text-xs text-zinc-500">
              Token válido hasta
              {{ new Date(status.expiresAt).toLocaleString() }}
            </p>
            <button
              @click="desconectar"
              :disabled="working"
              class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              Desconectar
            </button>
          </div>
          <div v-else class="space-y-3">
            <div class="flex items-center gap-2 text-sm">
              <span
                class="inline-block w-2.5 h-2.5 rounded-full bg-zinc-400"
              ></span>
              <span>No conectado</span>
            </div>
            <button
              @click="conectar"
              class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
            >
              Conectar Outlook
            </button>
          </div>
          <p v-if="statusError" class="text-xs text-red-600 mt-2">
            {{ statusError }}
          </p>
        </div>

        <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <h3 class="font-semibold mb-3">Gmail / Google Workspace</h3>

          <div v-if="gStatus?.connected" class="space-y-3">
            <div class="flex items-center gap-2 text-sm">
              <span
                class="inline-block w-2.5 h-2.5 rounded-full bg-green-500"
              ></span>
              <span class="font-medium"
                >Conectado{{
                  gProfile ? ` como ${gProfile.name || gProfile.email}` : ""
                }}</span
              >
            </div>
            <button
              @click="desconectarGoogle"
              :disabled="working"
              class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              Desconectar
            </button>
          </div>
          <div v-else class="space-y-3">
            <div class="flex items-center gap-2 text-sm">
              <span
                class="inline-block w-2.5 h-2.5 rounded-full bg-zinc-400"
              ></span>
              <span>No conectado</span>
            </div>
            <button
              @click="conectarGoogle"
              class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
            >
              Conectar Gmail
            </button>
          </div>
          <p v-if="gError" class="text-xs text-red-600 mt-2">{{ gError }}</p>
        </div>
      </div>
    </div>

    <!-- Config Google global (admin) -->
    <div
      v-if="authStore.user?.role === 'admin'"
      class="panel-flat mb-3 overflow-hidden"
    >
      <button
        @click="acordeon = acordeon === 'credenciales' ? '' : 'credenciales'"
        class="flex w-full items-center gap-3 p-5 text-left"
      >
        <Icon name="tokens" class="h-5 w-5 text-zinc-500" />
        <span class="flex-1">
          <span class="block font-semibold">Credenciales</span>
          <span class="block text-xs text-zinc-500"
            >Client ID y Secret de Microsoft y Google</span
          >
        </span>
        <svg
          class="h-4 w-4 text-zinc-400 transition-transform"
          :class="acordeon === 'credenciales' ? '' : '-rotate-90'"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="acordeon === 'credenciales'" class="px-5 pb-5 space-y-4">
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <h3 class="font-semibold mb-3">Credencial Google global</h3>
          <div class="text-sm text-zinc-500 mb-4 space-y-1">
            <p class="font-medium text-zinc-600 dark:text-zinc-400">
              Cómo obtener el Client ID y el Secret:
            </p>
            <ol class="list-decimal ml-5 space-y-0.5">
              <li>
                Entra a
                <span class="font-mono text-xs">console.cloud.google.com</span>
                → APIs y servicios → Credenciales.
              </li>
              <li>
                Crear credenciales → ID de cliente OAuth → tipo <b>Web</b>.
              </li>
              <li>En "URI de redirección" agrega la de abajo y guarda.</li>
              <li>
                Copia el ID y el secreto y pégalos aquí. Si la app está en modo
                prueba, añade a los empleados como usuarios de prueba.
              </li>
            </ol>
          </div>

          <form @submit.prevent="guardarGoogleConfig" class="space-y-4">
            <Field label="Client ID" required>
              <Input
                v-model="gConfig.clientId"
                type="text"
                required
                class="w-full"
              />
            </Field>
            <Field label="Client Secret" required>
              <Input
                v-model="gConfig.clientSecret"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </Field>
            <Field label="Redirect URI" required>
              <Input
                v-model="gConfig.redirectUri"
                type="text"
                required
                placeholder="http://localhost:3001/api/auth/google/callback"
                class="w-full"
              />
            </Field>
            <Field label="Scopes (uno por línea)">
              <Input
                v-model="gScopesText"
                multiline
                :rows="5"
                placeholder="https://www.googleapis.com/auth/gmail.readonly&#10;https://www.googleapis.com/auth/gmail.send&#10;https://www.googleapis.com/auth/calendar.readonly&#10;https://www.googleapis.com/auth/userinfo.email&#10;openid"
                class="w-full font-mono"
              />
              <p class="text-xs text-zinc-500 mt-1">
                Si se dejan vacíos se usan los recomendados. Si agregas uno
                nuevo, cada empleado debe reconectar su cuenta.
              </p>
            </Field>
            <div class="flex items-center gap-2">
              <Btn type="submit" :disabled="saving" :loading="saving">
                {{ saving ? "Guardando..." : "Guardar" }}
              </Btn>
              <span v-if="gSaveMsg" class="text-sm text-zinc-500">{{
                gSaveMsg
              }}</span>
            </div>
          </form>
        </div>

        <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <h3 class="font-semibold mb-3">Credencial Microsoft global</h3>
          <div class="text-sm text-zinc-500 mb-4 space-y-1">
            <p class="font-medium text-zinc-600 dark:text-zinc-400">
              Cómo obtener el Client ID y el Secret:
            </p>
            <ol class="list-decimal ml-5 space-y-0.5">
              <li>
                Entra a
                <span class="font-mono text-xs">entra.microsoft.com</span> →
                Aplicaciones → Registros → Nuevo registro (single-tenant).
              </li>
              <li>
                Copia el <b>ID de aplicación (cliente)</b> y créale un
                <b>secreto de cliente</b> en Certificados y secretos.
              </li>
              <li>
                En Permisos de API agrega los delegados de la lista de abajo y
                otorga consentimiento de administrador.
              </li>
              <li>
                En Autenticación agrega la URI de redirección de abajo. Los
                empleados solo usan "Conectar Outlook".
              </li>
            </ol>
          </div>

          <form @submit.prevent="guardarConfig" class="space-y-4">
            <Field label="Client ID" required>
              <Input
                v-model="config.clientId"
                type="text"
                required
                class="w-full"
              />
            </Field>
            <Field label="Client Secret" required>
              <Input
                v-model="config.clientSecret"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </Field>
            <Field label="Tenant ID">
              <Input
                v-model="config.tenantId"
                type="text"
                placeholder="common"
                class="w-full"
              />
            </Field>
            <Field label="Redirect URI" required>
              <Input
                v-model="config.redirectUri"
                type="text"
                required
                class="w-full"
              />
            </Field>
            <Field label="Scopes (uno por línea)">
              <Input
                v-model="scopesText"
                multiline
                :rows="5"
                placeholder="https://graph.microsoft.com/Mail.Read&#10;https://graph.microsoft.com/Mail.Send&#10;https://graph.microsoft.com/Calendars.Read&#10;https://graph.microsoft.com/User.Read&#10;offline_access"
                class="w-full font-mono"
              />
              <p class="text-xs text-zinc-500 mt-1">
                Definen a qué puede acceder el CRM en cada buzón. Deben
                coincidir con los permisos del App Registration; si agregas uno
                nuevo, cada empleado debe reconectar su cuenta.
              </p>
            </Field>
            <div class="flex items-center gap-2">
              <Btn type="submit" :disabled="saving" :loading="saving">
                {{ saving ? "Guardando..." : "Guardar" }}
              </Btn>
              <span v-if="saveMsg" class="text-sm text-zinc-500">{{
                saveMsg
              }}</span>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Campos personalizados (admin) -->
    <div
      v-if="authStore.user?.role === 'admin'"
      class="panel-flat mb-3 overflow-hidden"
    >
      <button
        @click="acordeon = acordeon === 'campos' ? '' : 'campos'"
        class="flex w-full items-center gap-3 p-5 text-left"
      >
        <Icon name="campos" class="h-5 w-5 text-zinc-500" />
        <span class="flex-1">
          <span class="block font-semibold">Campos</span>
          <span class="block text-xs text-zinc-500"
            >Campos propios de contactos, empresas y oportunidades</span
          >
        </span>
        <svg
          class="h-4 w-4 text-zinc-400 transition-transform"
          :class="acordeon === 'campos' ? '' : '-rotate-90'"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="acordeon === 'campos'" class="px-5 pb-5">
        <div class="flex gap-2 mb-4">
          <button
            v-for="ent in ['contacto', 'empresa', 'oportunidad']"
            :key="ent"
            @click="
              cfEntidad = ent;
              fetchCustomFields();
            "
            class="px-3 py-1.5 rounded-full text-xs border"
            :class="
              cfEntidad === ent
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900'
                : 'border-zinc-300 dark:border-zinc-600'
            "
          >
            {{ ent }}
          </button>
        </div>
        <ul class="divide-y divide-zinc-200 dark:divide-zinc-700 mb-4">
          <li
            v-for="f in customFields"
            :key="f.id"
            class="py-2 flex items-center justify-between text-sm"
          >
            <span
              >{{ f.etiqueta }}
              <span class="text-zinc-500 font-mono text-xs"
                >{{ f.clave }} · {{ f.tipo
                }}{{ f.requerido ? " · requerido" : "" }}</span
              ></span
            >
            <button
              @click="borrarCustomField(f)"
              class="text-red-600 hover:underline text-xs"
            >
              Eliminar
            </button>
          </li>
          <li v-if="!customFields.length" class="py-2 text-sm text-zinc-500">
            Sin campos en {{ cfEntidad }}.
          </li>
        </ul>
        <form
          @submit.prevent="crearCustomField"
          class="grid grid-cols-1 md:grid-cols-3 gap-2"
        >
          <input
            v-model="cfForm.clave"
            type="text"
            required
            pattern="[a-z][a-z0-9_]{1,49}"
            placeholder="clave (ej. rfc)"
            class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm font-mono"
          />
          <input
            v-model="cfForm.etiqueta"
            type="text"
            required
            placeholder="Etiqueta (ej. RFC)"
            class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"
          />
          <select
            v-model="cfForm.tipo"
            class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"
          >
            <option value="texto">Texto</option>
            <option value="numero">Número</option>
            <option value="fecha">Fecha</option>
            <option value="booleano">Sí/No</option>
            <option value="seleccion">Selección</option>
          </select>
          <input
            v-model="cfForm.opciones"
            type="text"
            placeholder="Opciones separadas por coma (solo selección)"
            class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"
          />
          <label class="flex items-center gap-2 text-sm px-1"
            ><input
              type="checkbox"
              v-model="cfForm.requerido"
              class="w-4 h-4"
            />
            Requerido</label
          >
          <button
            type="submit"
            class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            Añadir campo
          </button>
        </form>
        <p v-if="cfMsg" class="text-sm text-zinc-500 mt-2">{{ cfMsg }}</p>
      </div>
    </div>

    <!-- Modal usuario -->
    <Modal :open="showUserModal" @close="showUserModal = false">
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editingUser ? "Editar Usuario" : "Nuevo Usuario" }}
        </h2>
      </template>
      <form @submit.prevent="guardarUsuario" class="space-y-4">
        <Field label="Nombre" required>
          <Input v-model="userForm.name" type="text" required class="w-full" />
        </Field>
        <Field label="Email" required>
          <Input
            v-model="userForm.email"
            type="email"
            required
            :disabled="!!editingUser"
            class="w-full"
          />
        </Field>
        <div>
          <label class="block text-sm mb-1">{{
            editingUser ? "Nueva contraseña (vacío = mantener)" : "Contraseña *"
          }}</label>
          <Input
            v-model="userForm.password"
            type="password"
            :required="!editingUser"
            autocomplete="new-password"
            class="w-full"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <Field label="Rol">
            <Select v-model="userForm.role" class="w-full">
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <label class="flex items-center gap-2 text-sm pt-6 cursor-pointer"
            ><input type="checkbox" v-model="userForm.activo" class="w-4 h-4" />
            Activo</label
          >
        </div>
        <div class="flex gap-2 pt-2">
          <Btn
            type="button"
            variant="outline"
            class="flex-1"
            @click="showUserModal = false"
          >
            Cancelar
          </Btn>
          <Btn type="submit" variant="primary" class="flex-1"> Guardar </Btn>
        </div>
      </form>
    </Modal>

    <!-- Integraciones -->
    <div class="panel-flat mb-3 overflow-hidden">
      <button
        @click="acordeon = acordeon === 'integraciones' ? '' : 'integraciones'"
        class="flex w-full items-center gap-3 p-5 text-left"
      >
        <Icon name="integraciones" class="h-5 w-5 text-zinc-500" />
        <span class="flex-1">
          <span class="block font-semibold">Integraciones</span>
          <span class="block text-xs text-zinc-500"
            >Tokens de API y webhooks salientes</span
          >
        </span>
        <svg
          class="h-4 w-4 text-zinc-400 transition-transform"
          :class="acordeon === 'integraciones' ? '' : '-rotate-90'"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div v-show="acordeon === 'integraciones'" class="px-5 pb-5 space-y-4">
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <h3 class="font-semibold mb-1">Tokens de API</h3>
          <p class="text-sm text-zinc-500 mb-4">
            Tokens Bearer para integraciones. Usa
            <code class="font-mono text-xs">Authorization: Bearer crm_...</code>
            El token se muestra una sola vez. Documentación interactiva:
            <a
              href="/api/docs"
              target="_blank"
              class="text-blue-600 hover:underline font-mono text-xs"
              >/api/docs</a
            >
          </p>
          <div
            v-if="newToken"
            class="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm break-all"
          >
            <span class="font-medium">Guárdalo ahora: </span
            ><code class="font-mono">{{ newToken }}</code>
          </div>
          <form @submit.prevent="crearToken" class="flex gap-2 mb-4">
            <Input
              v-model="tokenName"
              type="text"
              required
              placeholder="Nombre del token"
              class="flex-1"
            />
            <Btn type="submit">Crear</Btn>
          </form>
          <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
            <li
              v-for="t in tokens"
              :key="t.id"
              class="py-2 flex items-center justify-between text-sm"
            >
              <span
                >{{ t.nombre }}
                <span class="text-zinc-500 font-mono text-xs"
                  >{{ t.prefijo }}…</span
                ></span
              >
              <button
                @click="borrarToken(t)"
                class="text-red-600 hover:underline text-xs"
              >
                Revocar
              </button>
            </li>
            <li v-if="!tokens.length" class="py-2 text-sm text-zinc-500">
              Sin tokens.
            </li>
          </ul>
        </div>

        <div
          v-if="authStore.user?.role === 'admin'"
          class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4"
        >
          <h3 class="font-semibold mb-1">Webhooks salientes</h3>
          <p class="text-sm text-zinc-500 mb-4">
            Avisan a tus sistemas con firma HMAC (<code
              class="font-mono text-xs"
              >X-CRM-Signature: sha256=...</code
            >).
          </p>
          <form @submit.prevent="crearWebhook" class="space-y-3 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                v-model="whForm.nombre"
                type="text"
                required
                placeholder="Nombre"
              />
              <Input
                v-model="whForm.url"
                type="url"
                required
                placeholder="https://..."
              />
            </div>
            <Input
              v-model="whForm.secret"
              type="text"
              required
              placeholder="Secreto para firmar (HMAC)"
              class="w-full"
            />
            <div class="flex flex-wrap gap-2">
              <label
                v-for="ev in whEventos"
                :key="ev"
                class="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-zinc-300 dark:border-zinc-600 cursor-pointer"
              >
                <input type="checkbox" :value="ev" v-model="whForm.eventos" />
                {{ ev }}
              </label>
            </div>
            <Btn type="submit">Añadir webhook</Btn>
          </form>
          <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
            <li v-for="w in webhooks" :key="w.id" class="py-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ w.nombre }}</span>
                <button
                  @click="borrarWebhook(w)"
                  class="text-red-600 hover:underline text-xs"
                >
                  Eliminar
                </button>
              </div>
              <div class="text-zinc-500 text-xs break-all">{{ w.url }}</div>
              <div class="text-zinc-500 text-xs">
                {{ (w.eventos || []).join(", ") }}
              </div>
              <button
                @click="verDeliveries(w)"
                class="text-blue-600 hover:underline text-xs mt-1"
              >
                Ver últimos envíos
              </button>
              <ul v-if="deliveries[w.id]" class="mt-1 space-y-1">
                <li
                  v-for="d in deliveries[w.id]"
                  :key="d.id"
                  class="text-xs font-mono"
                  :class="d.ok ? 'text-green-600' : 'text-red-600'"
                >
                  {{ new Date(d.created_at).toLocaleString() }} ·
                  {{ d.evento }} · {{ d.status_code ?? "—" }}
                  {{ d.error ? `· ${d.error}` : "" }}
                </li>
              </ul>
            </li>
            <li v-if="!webhooks.length" class="py-2 text-sm text-zinc-500">
              Sin webhooks.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import { useAuthStore } from "../stores/auth";
import Icon from "../components/Icon.vue";
import Btn from "../components/Btn.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import Modal from "../components/Modal.vue";

const authStore = useAuthStore();
const route = useRoute();

const acordeon = ref("conexiones");
const adminOpen = ref(true);
const status = ref(null);
const profile = ref(null);
const statusError = ref("");
const working = ref(false);
const banner = ref("");
const bannerOk = ref(false);

const config = ref({
  clientId: "",
  clientSecret: "",
  tenantId: "common",
  redirectUri: "",
  activo: true,
});
const scopesText = ref("");
const saving = ref(false);
const saveMsg = ref("");

const marcaForm = ref({
  nombre: "",
  color: "",
  logo: "",
  fondo: "",
  temaFondo: "#faf9f7",
  temaPanel: "#f1eee7",
});
const marcaLogoPreview = ref("");
const marcaFondoPreview = ref("");
const marcaMsg = ref("");
const showPreview = ref(false);
const temasPreset = [
  {
    nombre: "Alabastro",
    fondo: "#faf9f7",
    panel: "#f1eee7",
    primario: "#1c1917",
  },
  { nombre: "Océano", fondo: "#f4f8fb", panel: "#e6eef5", primario: "#0F6CBD" },
  { nombre: "Bosque", fondo: "#f5f8f4", panel: "#e5efe1", primario: "#047857" },
  { nombre: "Vino", fondo: "#faf6f6", panel: "#f2e7e5", primario: "#9D174D" },
  {
    nombre: "Grafito",
    fondo: "#f4f4f5",
    panel: "#e2e2e6",
    primario: "#3f3f46",
  },
];
const aplicarTema = (t) => {
  marcaForm.value.temaFondo = t.fondo;
  marcaForm.value.temaPanel = t.panel;
  marcaForm.value.color = t.primario === "#1c1917" ? "" : t.primario;
};
const temaActivo = (t) =>
  marcaForm.value.temaFondo === t.fondo &&
  marcaForm.value.temaPanel === t.panel;
const fondosPreset = [
  {
    nombre: "Por defecto",
    valor: "",
    estilo: "background: linear-gradient(135deg, #e9e4d9, #d7d0c2)",
  },
  { nombre: "Arena", valor: "#e9e4d9", estilo: "background-color: #e9e4d9" },
  { nombre: "Azul", valor: "#0F6CBD", estilo: "background-color: #0F6CBD" },
  { nombre: "Verde", valor: "#047857", estilo: "background-color: #047857" },
  { nombre: "Grafito", valor: "#1c1917", estilo: "background-color: #1c1917" },
];
const fondoActualPreview = computed(
  () => marcaFondoPreview.value || marcaForm.value.fondo,
);
const previewFondoStyle = computed(() => {
  const f = marcaFondoPreview.value || marcaForm.value.fondo;
  if (f && f.startsWith("data:"))
    return {
      backgroundImage: `url(${f})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  if (f) return { backgroundColor: f };
  return { background: "linear-gradient(135deg, #e9e4d9, #d7d0c2)" };
});
const previewBtnStyle = computed(() =>
  marcaForm.value.color ? { backgroundColor: marcaForm.value.color } : {},
);
const previewNombre = computed(() => marcaForm.value.nombre || "CRM");

const elegirFondo = (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  if (file.size > 1000000) {
    marcaMsg.value = "La foto debe pesar menos de 1 MB";
    ev.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    marcaFondoPreview.value = String(reader.result || "");
    marcaMsg.value = "";
  };
  reader.readAsDataURL(file);
  ev.target.value = "";
};

const quitarFondo = () => {
  marcaForm.value.fondo = "__quitar__";
  marcaFondoPreview.value = "";
};

const elegirLogo = (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  if (file.size > 500000) {
    marcaMsg.value = "El logo debe pesar menos de 500 KB";
    ev.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    marcaForm.value.logo = String(reader.result || "");
    marcaLogoPreview.value = marcaForm.value.logo;
    marcaMsg.value = "";
  };
  reader.readAsDataURL(file);
  ev.target.value = "";
};

const quitarLogo = () => {
  marcaForm.value.logo = "__quitar__";
  marcaLogoPreview.value = "";
};

const guardarMarca = async () => {
  saving.value = true;
  marcaMsg.value = "";
  try {
    const payload = {
      nombre: marcaForm.value.nombre,
      color: marcaForm.value.color,
      tema: {
        fondo: marcaForm.value.temaFondo,
        panel: marcaForm.value.temaPanel,
      },
    };
    payload.logo =
      marcaForm.value.logo === "__quitar__"
        ? ""
        : marcaForm.value.logo || undefined;
    if (marcaForm.value.fondo === "__quitar__") payload.fondo = "";
    else if (marcaFondoPreview.value) payload.fondo = marcaFondoPreview.value;
    else if (marcaForm.value.fondo) payload.fondo = marcaForm.value.fondo;
    await axios.put("/api/ajustes/marca", payload);
    const { loadMarca: reload, marca: marcaActual } =
      await import("../utils/marca.js");
    await reload();
    marcaForm.value = {
      nombre:
        marcaActual.value.nombre === "CRM" ? "" : marcaActual.value.nombre,
      color: marcaActual.value.color,
      logo: "",
      fondo: marcaActual.value.fondo,
      temaFondo: marcaActual.value.tema.fondo,
      temaPanel: marcaActual.value.tema.panel,
    };
    marcaLogoPreview.value = marcaActual.value.logo;
    marcaFondoPreview.value = "";
    marcaMsg.value = "Marca guardada";
  } catch (e) {
    marcaMsg.value = e.response?.data?.error || "Error guardando";
  } finally {
    saving.value = false;
  }
};

const tokens = ref([]);
const tokenName = ref("");
const newToken = ref("");
const webhooks = ref([]);
const whEventos = ref([]);
const whForm = ref({ nombre: "", url: "", secret: "", eventos: [] });
const deliveries = ref({});

const customFields = ref([]);
const cfEntidad = ref("contacto");
const cfForm = ref({
  clave: "",
  etiqueta: "",
  tipo: "texto",
  opciones: "",
  requerido: false,
});
const cfMsg = ref("");

const fetchCustomFields = async () => {
  try {
    const { data } = await axios.get("/api/custom-fields", {
      params: { entidad: cfEntidad.value },
    });
    customFields.value = data || [];
  } catch {
    customFields.value = [];
  }
};
const crearCustomField = async () => {
  cfMsg.value = "";
  try {
    await axios.post("/api/custom-fields", {
      entidad: cfEntidad.value,
      clave: cfForm.value.clave,
      etiqueta: cfForm.value.etiqueta,
      tipo: cfForm.value.tipo,
      opciones: cfForm.value.opciones
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      requerido: cfForm.value.requerido,
    });
    cfForm.value = {
      clave: "",
      etiqueta: "",
      tipo: "texto",
      opciones: "",
      requerido: false,
    };
    await fetchCustomFields();
  } catch (e) {
    cfMsg.value = e.response?.data?.error || "Error creando campo";
  }
};
const borrarCustomField = async (f) => {
  if (
    !(await confirmar(
      `¿Eliminar campo ${f.etiqueta}? Los valores guardados se conservan.`,
    ))
  )
    return;
  await axios.delete(`/api/custom-fields/${f.id}`);
  await fetchCustomFields();
};

const equipos = ref([]);
const usuarios = ref([]);
const eqNombre = ref("");
const eqAdd = ref({});

const fetchEquipos = async () => {
  try {
    const { data } = await axios.get("/api/equipos");
    equipos.value = data || [];
  } catch {
    equipos.value = [];
  }
};
const crearEquipo = async () => {
  await axios.post("/api/equipos", { nombre: eqNombre.value });
  eqNombre.value = "";
  await fetchEquipos();
};
const borrarEquipo = async (eq) => {
  if (!(await confirmar(`¿Eliminar equipo ${eq.nombre}?`))) return;
  await axios.delete(`/api/equipos/${eq.id}`);
  await fetchEquipos();
};
const agregarMiembro = async (eq) => {
  if (!eqAdd.value[eq.id]) return;
  await axios.post(`/api/equipos/${eq.id}/miembros`, {
    userId: eqAdd.value[eq.id],
  });
  eqAdd.value[eq.id] = "";
  await fetchEquipos();
};
const quitarMiembro = async (eq, m) => {
  await axios.delete(`/api/equipos/${eq.id}/miembros/${m.userId}`);
  await fetchEquipos();
};

const modulos = [
  "contactos",
  "empresas",
  "oportunidades",
  "productos",
  "presupuestos",
  "tareas",
  "correos",
  "calendario",
  "campañas",
  "plantillas",
  "listas",
  "automatizaciones",
  "actividades",
  "reportes",
];
const showUserModal = ref(false);
const editingUser = ref(null);
const userForm = ref({
  name: "",
  email: "",
  password: "",
  role: "user",
  activo: true,
});
const permUser = ref(null);
const permMap = ref({});

const emptyPermMap = () =>
  Object.fromEntries(modulos.map((m) => [m, { r: false, w: false, x: false }]));

const fetchUsuarios = async () => {
  try {
    const { data } = await axios.get("/api/users");
    usuarios.value = data || [];
  } catch {
    usuarios.value = [];
  }
};

const openUserModal = (u) => {
  editingUser.value = u;
  userForm.value = u
    ? {
        name: u.name,
        email: u.email,
        password: "",
        role: u.role,
        activo: u.activo,
      }
    : { name: "", email: "", password: "", role: "user", activo: true };
  showUserModal.value = true;
};

const guardarUsuario = async () => {
  try {
    if (editingUser.value) {
      const payload = {
        name: userForm.value.name,
        role: userForm.value.role,
        activo: userForm.value.activo,
      };
      if (userForm.value.password) payload.password = userForm.value.password;
      await axios.put(`/api/users/${editingUser.value.id}`, payload);
    } else {
      await axios.post("/api/users", userForm.value);
    }
    showUserModal.value = false;
    await fetchUsuarios();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error guardando usuario");
  }
};

const borrarUsuario = async (u) => {
  if (!(await confirmar(`¿Eliminar a ${u.name}?`))) return;
  try {
    await axios.delete(`/api/users/${u.id}`);
    await fetchUsuarios();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error eliminando");
  }
};

const editarPermisos = async (u) => {
  permUser.value = u;
  permMap.value = emptyPermMap();
  try {
    const { data } = await axios.get(`/api/users/${u.id}/permisos`);
    for (const m of modulos) {
      if (data[m]) permMap.value[m] = { ...data[m] };
    }
  } catch {
    /* */
  }
};

const guardarPermisos = async () => {
  try {
    await axios.put(`/api/users/${permUser.value.id}/permisos`, {
      permisos: modulos.map((m) => ({ modulo: m, ...permMap.value[m] })),
    });
    permUser.value = null;
  } catch (e) {
    toast.error(e.response?.data?.error || "Error guardando permisos");
  }
};

const fetchTokens = async () => {
  try {
    tokens.value = (await axios.get("/api/api-tokens")).data;
  } catch {
    /* */
  }
};
const crearToken = async () => {
  try {
    const { data } = await axios.post("/api/api-tokens", {
      nombre: tokenName.value,
    });
    newToken.value = data.token;
    tokenName.value = "";
    await fetchTokens();
  } catch {
    /* */
  }
};
const borrarToken = async (t) => {
  if (!(await confirmar(`¿Revocar ${t.nombre}?`))) return;
  await axios.delete(`/api/api-tokens/${t.id}`);
  await fetchTokens();
};
const fetchWebhooks = async () => {
  try {
    const { data } = await axios.get("/api/webhooks");
    webhooks.value = data.endpoints || [];
    whEventos.value = data.eventos || [];
  } catch {
    /* sin permiso */
  }
};
const crearWebhook = async () => {
  try {
    await axios.post("/api/webhooks", whForm.value);
    whForm.value = { nombre: "", url: "", secret: "", eventos: [] };
    await fetchWebhooks();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error creando webhook");
  }
};
const borrarWebhook = async (w) => {
  if (!(await confirmar(`¿Eliminar ${w.nombre}?`))) return;
  await axios.delete(`/api/webhooks/${w.id}`);
  await fetchWebhooks();
};
const verDeliveries = async (w) => {
  try {
    const { data } = await axios.get(`/api/webhooks/${w.id}/deliveries`);
    deliveries.value = { ...deliveries.value, [w.id]: data };
  } catch {
    /* */
  }
};

const conectar = () => {
  window.location.href = "/api/auth/microsoft/connect";
};

const gStatus = ref(null);
const gProfile = ref(null);
const gError = ref("");
const gConfig = ref({ clientId: "", clientSecret: "", redirectUri: "" });
const gScopesText = ref("");
const gSaveMsg = ref("");

const conectarGoogle = () => {
  window.location.href = "/api/auth/google/connect";
};

const desconectarGoogle = async () => {
  working.value = true;
  try {
    await axios.delete("/api/google/disconnect");
    gStatus.value = { connected: false };
    gProfile.value = null;
  } catch {
    gError.value = "No se pudo desconectar";
  } finally {
    working.value = false;
  }
};

const guardarGoogleConfig = async () => {
  saving.value = true;
  gSaveMsg.value = "";
  try {
    const payload = {
      clientId: gConfig.value.clientId,
      redirectUri: gConfig.value.redirectUri,
      scopes: gScopesText.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (gConfig.value.clientSecret)
      payload.clientSecret = gConfig.value.clientSecret;
    await axios.put("/api/google/config", payload);
    gConfig.value.clientSecret = "";
    gSaveMsg.value = "Configuración guardada";
  } catch (e) {
    gSaveMsg.value = e.response?.data?.error || "Error guardando configuración";
  } finally {
    saving.value = false;
  }
};

const desconectar = async () => {
  working.value = true;
  try {
    await axios.delete("/api/microsoft/disconnect");
    status.value = { connected: false };
    profile.value = null;
  } catch (e) {
    statusError.value = "No se pudo desconectar";
  } finally {
    working.value = false;
  }
};

const guardarConfig = async () => {
  saving.value = true;
  saveMsg.value = "";
  try {
    const payload = {
      clientId: config.value.clientId,
      tenantId: config.value.tenantId || "common",
      redirectUri: config.value.redirectUri,
      scopes: scopesText.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      activo: true,
    };
    if (config.value.clientSecret)
      payload.clientSecret = config.value.clientSecret;
    await axios.put("/api/microsoft/config", payload);
    config.value.clientSecret = "";
    saveMsg.value = "Configuración guardada";
  } catch (e) {
    saveMsg.value = e.response?.data?.error || "Error guardando configuración";
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  if (route.query.microsoft_connected) {
    banner.value = "Outlook conectado correctamente";
    bannerOk.value = true;
  } else if (route.query.microsoft_error) {
    banner.value = `Error conectando Outlook: ${route.query.microsoft_error}`;
    bannerOk.value = false;
  } else if (route.query.google_connected) {
    banner.value = "Gmail conectado correctamente";
    bannerOk.value = true;
  } else if (route.query.google_error) {
    banner.value = `Error conectando Gmail: ${route.query.google_error}`;
    bannerOk.value = false;
  }
  try {
    const { data } = await axios.get("/api/google/status");
    gStatus.value = data;
    if (data.connected) {
      try {
        const p = await axios.get("/api/google/profile");
        if (!p.data?.error) gProfile.value = p.data;
      } catch {
        /* sin perfil */
      }
    }
  } catch {
    gError.value = "No se pudo consultar el estado de Google";
  }
  try {
    const { data } = await axios.get("/api/microsoft/status");
    status.value = data;
    if (data.connected) {
      try {
        const p = await axios.get("/api/microsoft/profile");
        if (!p.data?.error) profile.value = p.data;
      } catch {
        /* sin perfil */
      }
    }
  } catch (e) {
    statusError.value = "No se pudo consultar el estado";
  }
  await fetchTokens();
  try {
    const { data } = await axios.get("/api/ajustes/marca");
    marcaForm.value = {
      nombre: data.nombre === "CRM" ? "" : data.nombre || "",
      color: data.color || "",
      logo: "",
      fondo: data.fondo || "",
      temaFondo: (data.tema || {}).fondo || "#faf9f7",
      temaPanel: (data.tema || {}).panel || "#f1eee7",
    };
    marcaLogoPreview.value = data.logo || "";
    marcaFondoPreview.value = "";
  } catch {
    /* */
  }
  if (authStore.user?.role === "admin") {
    try {
      const { data } = await axios.get("/api/users");
      usuarios.value = data || [];
    } catch {
      /* */
    }
    await fetchEquipos();
    try {
      const { data } = await axios.get("/api/google/config");
      if (data.configured) {
        gConfig.value.clientId = data.config.clientId || "";
        gConfig.value.redirectUri = data.config.redirectUri || "";
        gConfig.value.clientSecretConfigured =
          data.config.clientSecretConfigured;
        gScopesText.value = (data.config.scopes || []).join("\n");
      }
    } catch {
      /* sin config */
    }
    await fetchCustomFields();
    await fetchWebhooks();
    try {
      const { data } = await axios.get("/api/microsoft/config");
      if (data.configured) {
        config.value.clientId = data.config.clientId || "";
        config.value.tenantId = data.config.tenantId || "common";
        config.value.redirectUri = data.config.redirectUri || "";
        config.value.clientSecretConfigured =
          data.config.clientSecretConfigured;
        scopesText.value = (data.config.scopes || []).join("\n");
      }
    } catch {
      /* sin config */
    }
  }
});
</script>
