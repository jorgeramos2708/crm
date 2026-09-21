<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <Btn @click="showSend = !showSend"
        ><Icon name="redactar" class="h-4 w-4" /> Redactar</Btn
      >
    </header>

    <div class="flex gap-3 mb-4">
      <button
        @click="
          provider = 'microsoft';
          fetchEmails();
        "
        title="Outlook"
        class="flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-colors"
        :class="
          provider === 'microsoft'
            ? 'border-[#0F6CBD] bg-blue-50 dark:bg-blue-400/10'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
        "
      >
        <img
          src="https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/microsoft-outlook.svg"
          alt="Logo de Outlook"
          class="h-7 w-7"
          aria-label="Logo de Outlook"
          role="img"
          @error="
            this.onerror = null;
            this.src =
              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMCIgd2lkdGg9IjEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9Im5vbmUiIHN0eWxlPSJmaWxsOiNGRkY7IiBzdHJva2U9IiIgc3Ryb2tlLXdpZHRoPSIxMiIvPjwvc3ZnPg==';
          "
        />
        <span class="text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
          >Outlook</span
        >
      </button>
      <button
        @click="
          provider = 'google';
          fetchEmails();
        "
        title="Gmail"
        class="flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-colors"
        :class="
          provider === 'google'
            ? 'border-[#EA4335] bg-red-50 dark:bg-red-400/10'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
        "
      >
        <img
          src="https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/gmail.svg"
          alt="Logo de Gmail"
          class="h-7 w-7"
          aria-label="Logo de Gmail"
          role="img"
          @error="
            this.onerror = null;
            this.src =
              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMCIgd2lkdGg9IjEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9Im5vbmUiIHN0eWxlPSJmaWxsOiNGRkY7IiBzdHJva2U9IiIgc3Ryb2tlLXdpZHRoPSIxMiIvPjwvc3ZnPg==';
          "
        />
        <span class="text-[11px] font-medium text-zinc-600 dark:text-zinc-400"
          >Gmail</span
        >
      </button>
    </div>

    <div
      v-if="!curStatus?.connected"
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg text-sm mb-4"
    >
      {{ provider === "microsoft" ? "Outlook" : "Gmail" }} no conectado.
      <router-link to="/settings" class="underline font-medium"
        >Conéctalo en Configuración</router-link
      >
    </div>

    <!-- Redactar -->
    <Card v-if="showSend" variant="elevated" class="p-6 mb-6">
      <h2 class="font-semibold mb-4">
        Nuevo correo (vía {{ provider === "microsoft" ? "Outlook" : "Gmail" }})
      </h2>
      <form @submit.prevent="enviar" class="space-y-3">
        <Input
          v-model="send.to"
          type="text"
          required
          placeholder="Para (separa con comas)"
          class="w-full"
        />
        <Input
          v-model="send.subject"
          type="text"
          required
          placeholder="Asunto"
          class="w-full"
        />
        <Input
          v-model="send.body"
          multiline
          :rows="5"
          required
          placeholder="Mensaje..."
          class="w-full"
        />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select v-model="send.contactoId">
            <option value="">Vincular a contacto (opcional)...</option>
            <option v-for="c in contactos" :key="c.id" :value="c.id">
              {{ c.nombre }}
            </option>
          </Select>
          <Select v-model="send.oportunidadId">
            <option value="">Vincular a oportunidad (opcional)...</option>
            <option v-for="o in oportunidades" :key="o.id" :value="o.id">
              {{ o.nombre }}
            </option>
          </Select>
        </div>
        <div class="flex items-center gap-2">
          <Btn type="submit" :disabled="sending" :loading="sending">{{
            sending ? "Enviando..." : "Enviar"
          }}</Btn>
          <span v-if="sendMsg" class="text-sm text-zinc-500">{{
            sendMsg
          }}</span>
        </div>
      </form>
    </Card>

    <!-- Bandeja -->
    <Card variant="elevated" class="overflow-hidden">
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
        <Select
          v-if="provider === 'microsoft'"
          v-model="folder"
          @change="fetchEmails"
        >
          <option value="inbox">Recibidos</option>
          <option value="sentitems">Enviados</option>
          <option value="drafts">Borradores</option>
        </Select>
        <Input
          v-else
          v-model="gQuery"
          @keyup.enter="fetchEmails"
          type="text"
          placeholder="Buscar en Gmail..."
          class="flex-1"
        />
        <Btn
          variant="outline"
          @click="fetchEmails"
          :disabled="loading"
          :loading="loading"
          >{{ loading ? "Cargando..." : "Actualizar" }}</Btn
        >
        <Badge v-if="live" color="green" variant="pill" pulse class="ml-auto"
          >En vivo</Badge
        >
      </div>
      <p v-if="mailError" class="px-6 py-3 text-sm text-red-600">
        {{ mailError }}
      </p>
      <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
        <li v-for="m in emails" :key="m.id" class="px-6 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div
                class="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate"
              >
                {{ m.subject || "(sin asunto)" }}
              </div>
              <div class="text-xs text-zinc-500">
                {{
                  m.from?.emailAddress?.name ||
                  m.from?.emailAddress?.address ||
                  ""
                }}
                {{
                  m.from?.emailAddress?.address
                    ? `&lt;${m.from.emailAddress.address}&gt;`
                    : ""
                }}
                · {{ formatDate(m.receivedDateTime || m.sentDateTime) }}
              </div>
              <div
                class="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2"
              >
                {{ m.bodyPreview }}
              </div>
            </div>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <Select v-model="linkSel[m.id]" size="sm">
              <option value="">Vincular a...</option>
              <optgroup label="Contactos">
                <option
                  v-for="c in contactos"
                  :key="'c' + c.id"
                  :value="'c:' + c.id"
                >
                  {{ c.nombre }}
                </option>
              </optgroup>
              <optgroup label="Oportunidades">
                <option
                  v-for="o in oportunidades"
                  :key="'o' + o.id"
                  :value="'o:' + o.id"
                >
                  {{ o.nombre }}
                </option>
              </optgroup>
            </Select>
            <Btn
              variant="outline"
              size="sm"
              @click="vincular(m)"
              :disabled="!linkSel[m.id]"
              >Vincular</Btn
            >
            <span v-if="linkMsg[m.id]" class="text-xs text-zinc-500">{{
              linkMsg[m.id]
            }}</span>
          </div>
        </li>
        <li
          v-if="!emails.length && !loading"
          class="px-6 py-12 text-center text-zinc-500 text-sm"
        >
          Sin correos en esta carpeta.
        </li>
      </ul>
    </Card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import Btn from "../components/Btn.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Icon from "../components/Icon.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";

const live = ref(false);
let es = null;

const connectStream = () => {
  try {
    es = new EventSource("/api/stream", { withCredentials: true });
    es.onopen = () => {
      live.value = true;
    };
    es.onerror = () => {
      live.value = false;
    };
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "mail.received") fetchEmails();
      } catch {
        /* heartbeat u otro evento */
      }
    };
  } catch {
    /* SSE no disponible: queda el botón Actualizar */
  }
};

const provider = ref("microsoft");
const msStatus = ref(null);
const gStatus = ref(null);
const curStatus = computed(() =>
  provider.value === "microsoft" ? msStatus.value : gStatus.value,
);
const emails = ref([]);
const contactos = ref([]);
const oportunidades = ref([]);
const folder = ref("inbox");
const gQuery = ref("");
const loading = ref(false);
const mailError = ref("");
const showSend = ref(false);
const send = ref({
  to: "",
  subject: "",
  body: "",
  contactoId: "",
  oportunidadId: "",
});
const sending = ref(false);
const sendMsg = ref("");
const linkSel = reactive({});
const linkMsg = reactive({});

const formatDate = (d) => {
  try {
    return d ? new Date(d).toLocaleString() : "";
  } catch {
    return "";
  }
};

const fetchEmails = async () => {
  loading.value = true;
  mailError.value = "";
  try {
    const { data } =
      provider.value === "microsoft"
        ? await axios.get("/api/microsoft/emails", {
            params: { folder: folder.value, top: 25 },
          })
        : await axios.get("/api/google/emails", {
            params: { q: gQuery.value || undefined, max: 25 },
          });
    emails.value = data.data || [];
  } catch (e) {
    mailError.value =
      e.response?.data?.error || "No se pudieron cargar los correos";
  } finally {
    loading.value = false;
  }
};

const enviar = async () => {
  sending.value = true;
  sendMsg.value = "";
  try {
    await axios.post(`/api/${provider.value}/send`, {
      to: send.value.to
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      subject: send.value.subject,
      htmlBody: `<p>${send.value.body.replace(/\n/g, "<br>")}</p>`,
      contactoId: send.value.contactoId || undefined,
      oportunidadId: send.value.oportunidadId || undefined,
    });
    sendMsg.value = "Enviado y vinculado";
    send.value = {
      to: "",
      subject: "",
      body: "",
      contactoId: "",
      oportunidadId: "",
    };
  } catch (e) {
    sendMsg.value = e.response?.data?.error || "Error enviando";
  } finally {
    sending.value = false;
  }
};

const vincular = async (m) => {
  const sel = linkSel[m.id];
  if (!sel) return;
  const [kind, id] = sel.split(":");
  try {
    await axios.post("/api/microsoft/vincular", {
      messageId: m.id,
      asunto: m.subject,
      from: m.from?.emailAddress?.address,
      contactoId: kind === "c" ? id : undefined,
      oportunidadId: kind === "o" ? id : undefined,
    });
    linkMsg[m.id] = "Vinculado ✓";
  } catch (e) {
    linkMsg[m.id] = e.response?.data?.error || "Error";
  }
};

onMounted(async () => {
  try {
    msStatus.value = (await axios.get("/api/microsoft/status")).data;
  } catch {
    msStatus.value = { connected: false };
  }
  try {
    gStatus.value = (await axios.get("/api/google/status")).data;
  } catch {
    gStatus.value = { connected: false };
  }
  try {
    contactos.value =
      (await axios.get("/api/contactos", { params: { limit: 100 } })).data
        .data || [];
  } catch {
    /* */
  }
  try {
    oportunidades.value =
      (await axios.get("/api/oportunidades", { params: { limit: 100 } })).data
        .data || [];
  } catch {
    /* */
  }
  if (msStatus.value?.connected) {
    await fetchEmails();
    connectStream();
  }
});

onBeforeUnmount(() => {
  try {
    es?.close();
  } catch {
    /* noop */
  }
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
