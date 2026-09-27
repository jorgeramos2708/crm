<!-- CustomFields: campos personalizados por entidad con los controles del
  sistema de diseño (Field + Input/Select + FechaInput). El checkbox booleano
  queda nativo a propósito (convención del DS). -->
<template>
  <div v-if="fields.length" class="space-y-4">
    <div v-for="f in fields" :key="f.id">
      <Field
        v-if="f.tipo === 'texto' || f.tipo === 'numero'"
        :label="f.etiqueta"
        :required="f.requerido"
      >
        <Input
          v-model="model[f.clave]"
          :type="f.tipo === 'numero' ? 'number' : 'text'"
          :required="f.requerido"
          class="w-full"
        />
      </Field>
      <Field
        v-else-if="f.tipo === 'fecha'"
        :label="f.etiqueta"
        :required="f.requerido"
      >
        <FechaInput v-model="model[f.clave]" :required="f.requerido" />
      </Field>
      <label
        v-else-if="f.tipo === 'booleano'"
        class="flex items-center gap-2 cursor-pointer text-sm"
      >
        <input v-model="model[f.clave]" type="checkbox" class="w-4 h-4" />
        {{ f.etiqueta }}{{ f.requerido ? " *" : "" }}
      </label>
      <Field
        v-else-if="f.tipo === 'seleccion'"
        :label="f.etiqueta"
        :required="f.requerido"
      >
        <Select v-model="model[f.clave]" :required="f.requerido" class="w-full">
          <option value="">Seleccionar...</option>
          <option v-for="op in f.opciones || []" :key="op" :value="op">
            {{ op }}
          </option>
        </Select>
      </Field>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import FechaInput from "./FechaInput.vue";
import Field from "./Field.vue";
import Input from "./Input.vue";
import Select from "./Select.vue";

const props = defineProps({
  entidad: { type: String, required: true },
  modelValue: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["update:modelValue"]);

const fields = ref([]);
const model = ref({ ...(props.modelValue || {}) });

const sonIguales = (a, b) => {
  const x = a || {};
  const y = b || {};
  const ka = Object.keys(x);
  const kb = Object.keys(y);
  return ka.length === kb.length && ka.every((k) => x[k] === y[k]);
};

watch(
  model,
  (v) => {
    if (!sonIguales(v, props.modelValue)) emit("update:modelValue", { ...v });
  },
  { deep: true },
);
watch(
  () => props.modelValue,
  (v) => {
    const next = { ...(v || {}) };
    if (!sonIguales(model.value, next)) model.value = next;
  },
);

onMounted(async () => {
  try {
    const { data } = await axios.get("/api/custom-fields", {
      params: { entidad: props.entidad },
    });
    fields.value = data || [];
  } catch {
    /* */
  }
});
</script>
