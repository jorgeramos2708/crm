<template>
  <div class="flex flex-wrap items-center gap-2">
    <Select v-model="sel" @change="aplicarSel">
      <option value="">Vistas guardadas...</option>
      <option v-for="v in vistas" :key="v.id" :value="v.id">
        {{ v.nombre }}
      </option>
    </Select>
    <Btn v-if="sel" variant="link-danger" class="text-xs" @click="borrarSel"
      >Eliminar vista</Btn
    >
    <div class="flex gap-1">
      <Input
        v-model="nombre"
        type="text"
        placeholder="Guardar vista actual como..."
      />
      <Btn variant="outline" @click="guardar" :disabled="!nombre">Guardar</Btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import Btn from "./Btn.vue";
import Input from "./Input.vue";
import Select from "./Select.vue";

const props = defineProps({
  entidad: { type: String, required: true },
  capturar: { type: Function, required: true },
  aplicar: { type: Function, required: true },
});

const vistas = ref([]);
const sel = ref("");
const nombre = ref("");

const fetchVistas = async () => {
  try {
    const { data } = await axios.get("/api/vistas", {
      params: { entidad: props.entidad },
    });
    vistas.value = data || [];
  } catch {
    vistas.value = [];
    toast.error("Error al cargar vistas");
  }
};

const guardar = async () => {
  try {
    await axios.post("/api/vistas", {
      entidad: props.entidad,
      nombre: nombre.value,
      filtros: props.capturar(),
    });
    nombre.value = "";
    await fetchVistas();
  } catch (e) {
    console.error(e);
    toast.error("Error al guardar vista");
  }
};

const aplicarSel = () => {
  const v = vistas.value.find((x) => x.id === sel.value);
  if (v) props.aplicar(v.filtros || {});
};

const borrarSel = async () => {
  if (!sel.value || !(await confirmar("¿Eliminar esta vista?"))) return;
  try {
    await axios.delete(`/api/vistas/${sel.value}`);
    sel.value = "";
    await fetchVistas();
  } catch (e) {
    console.error(e);
    toast.error("Error al eliminar vista");
  }
};

onMounted(fetchVistas);
</script>
