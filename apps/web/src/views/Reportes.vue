<template>
  <div class="p-6">
    <header class="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div class="flex flex-wrap gap-2 items-end">
        <div
          class="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 print:hidden"
        >
          <button
            v-for="t in tabs"
            :key="t.id"
            class="px-3 py-1.5 text-sm rounded-md transition"
            :class="
              tab === t.id
                ? 'bg-white dark:bg-zinc-700 shadow font-medium'
                : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
            "
            @click="setTab(t.id)"
          >
            {{ t.label }}
          </button>
        </div>
        <Select v-model="pipelineId" @change="loadTab">
          <option value="">Todos los pipelines</option>
          <option v-for="p in pipelines" :key="p.id" :value="p.id">
            {{ p.nombre }}
          </option>
        </Select>
      </div>
      <div class="flex gap-2 print:hidden">
        <Btn variant="icon" @click="openMetabase" title="Abrir Metabase">
          <Icon name="reportes" class="h-4 w-4" />
        </Btn>
        <Btn variant="icon" @click="exportarPdf" title="Exportar PDF">
          <Icon name="download" class="h-4 w-4" />
        </Btn>
      </div>
    </header>

    <!-- ── Embudo ── -->
    <template v-if="tab === 'embudo'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-8">
        <StatCard
          title="Oportunidades"
          :value="funnel.total || 0"
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          color="blue"
        />
        <StatCard
          title="Valor total"
          :value="formatCurrency(funnel.valorTotal)"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="green"
        />
        <StatCard
          title="Estimado"
          :value="formatCurrency(funnel.estimadoTotal)"
          icon="M13 10V3L4 14h7v7l9-11h-7z"
          color="purple"
        />
        <StatCard
          title="Ticket medio"
          :value="formatCurrency(funnel.ticketMedio)"
          icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          color="orange"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <Card class="p-6 lg:col-span-3">
          <h2 class="text-lg font-semibold mb-3">Importe por mes</h2>
          <GraficaBarras :datos="mensual" color="#3b82f6" />
        </Card>
        <Card class="p-6 lg:col-span-2 flex flex-col">
          <h2 class="text-lg font-semibold mb-3">Reparto por etapa</h2>
          <div class="flex-1 flex items-center justify-center">
            <GraficaDona
              :datos="
                (funnel.etapas || []).map((e) => ({
                  etiqueta: e.nombre,
                  count: e.count,
                  color: e.color || '#3b82f6',
                }))
              "
              centro="Negocios"
            />
          </div>
        </Card>
      </div>

      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Embudo por etapa</h2>
        <div v-if="loading" class="text-sm text-zinc-500">Cargando...</div>
        <div v-else class="space-y-4">
          <div v-for="e in funnel.etapas || []" :key="e.stageId">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="font-medium flex items-center gap-2">
                <Badge :hex="e.color || '#3b82f6'" dot-size="h-2.5 w-2.5" />
                {{ e.nombre }}
              </span>
              <span class="flex flex-wrap items-center gap-1.5">
                <Badge color="zinc" variant="pill" class="tabular-nums"
                  >{{ e.count }}
                  {{ e.count === 1 ? "negocio" : "negocios" }}</Badge
                >
                <Badge color="green" variant="pill" class="tabular-nums"
                  >{{ formatCurrency(e.importe) }} total</Badge
                >
                <Badge color="blue" variant="pill" class="tabular-nums"
                  >{{ formatCurrency(e.estimado) }} estimado</Badge
                >
              </span>
            </div>
            <div
              class="h-3 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all"
                :style="{
                  width: pct(e.count) + '%',
                  backgroundColor: e.color || '#3b82f6',
                }"
              ></div>
            </div>
          </div>
          <div v-if="loading && !funnel.etapas?.length" class="py-2">
            <Skeleton :filas="4" />
          </div>
          <p
            v-if="!loading && !funnel.etapas?.length"
            class="text-sm text-zinc-500"
          >
            Sin etapas.
          </p>
        </div>
      </Card>
    </template>

    <!-- ── Vendedores ── -->
    <template v-else-if="tab === 'vendedores'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-8">
        <StatCard
          title="Vendedores activos"
          :value="vendedores.length"
          icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a4 4 0 11-4-4"
          color="blue"
        />
        <StatCard
          title="Mejor por importe"
          :value="formatCurrency(topSellerValor)"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="green"
        />
        <StatCard
          title="Negocios totales"
          :value="totalNegociosVend"
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          color="purple"
        />
        <StatCard
          title="Valor total pipeline"
          :value="formatCurrency(valorTotalVend)"
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          color="orange"
        />
      </div>

      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Ranking de vendedores</h2>
        <div v-if="loading" class="text-sm text-zinc-500">Cargando...</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr
              class="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-700"
            >
              <th class="py-2 pr-3">#</th>
              <th class="py-2 pr-3">Vendedor</th>
              <th class="py-2 pr-3 text-right">Negocios</th>
              <th class="py-2 pr-3 text-right">Valor total</th>
              <th class="py-2 text-right">Estimado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(v, i) in vendedores"
              :key="v.propietarioId"
              class="border-b border-zinc-100 dark:border-zinc-800"
            >
              <td class="py-2 pr-3 tabular-nums text-zinc-400">{{ i + 1 }}</td>
              <td class="py-2 pr-3 font-medium">
                {{ v.nombre }}
                <span class="text-zinc-400 font-normal">{{ v.email }}</span>
              </td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ v.count }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">
                {{ formatCurrency(v.valorTotal) }}
              </td>
              <td class="py-2 text-right tabular-nums text-blue-600">
                {{ formatCurrency(v.estimado) }}
              </td>
            </tr>
            <tr v-if="!loading && !vendedores.length">
              <td colspan="5" class="py-4 text-zinc-500">Sin datos.</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </template>

    <!-- ── Actividad ── -->
    <template v-else-if="tab === 'actividad'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-8">
        <StatCard
          title="Actividades totales"
          :value="actividad.total"
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          color="blue"
        />
        <StatCard
          title="Tipos distintos"
          :value="actividad.porTipo.length"
          icon="M4 6h16M4 10h16M4 14h16M4 18h16"
          color="green"
        />
        <StatCard
          title="Últimos 30 días"
          :value="actividad30"
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          color="purple"
        />
        <StatCard
          title="Tareas vencidas"
          :value="tareas.vencidas"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="orange"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-3">Por tipo de actividad</h2>
          <div class="space-y-2">
            <div
              v-for="t in actividad.porTipo"
              :key="t.tipo"
              class="flex items-center justify-between text-sm"
            >
              <span class="capitalize">{{ t.tipo.replace(/_/g, " ") }}</span>
              <Badge color="blue" variant="pill" class="tabular-nums">{{
                t.count
              }}</Badge>
            </div>
            <p v-if="!actividad.porTipo.length" class="text-sm text-zinc-500">
              Sin actividad.
            </p>
          </div>
        </Card>
        <Card class="p-6">
          <h2 class="text-lg font-semibold mb-3">Tareas</h2>
          <div class="space-y-2">
            <div
              v-for="e in tareas.porEstado"
              :key="e.estado"
              class="flex items-center justify-between text-sm"
            >
              <span>{{
                e.estado
                  .replace(/_/g, " ")
                  .replace(/^./, (c) => c.toUpperCase())
              }}</span>
              <Badge color="zinc" variant="pill" class="tabular-nums">{{
                e.count
              }}</Badge>
            </div>
            <div class="pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div
                v-for="p in tareas.porPrioridad"
                :key="p.prioridad"
                class="flex items-center justify-between text-sm"
              >
                <span class="capitalize">Prioridad {{ p.prioridad }}</span>
                <Badge
                  :color="colorPrioridad[p.prioridad] || 'zinc'"
                  variant="pill"
                  class="tabular-nums"
                  >{{ p.count }}</Badge
                >
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card class="p-6 mb-4">
        <h2 class="text-lg font-semibold mb-3">Actividad (30 días)</h2>
        <GraficaLinea
          :datos="
            (actividad.serie || []).map((d) => ({
              etiqueta: d.fecha || d.etiqueta || '',
              valor: d.count,
              valorFmt: String(d.count),
            }))
          "
          color="#3b82f6"
          aria-label="Serie de actividad de los últimos 30 días"
        />
      </Card>

      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-3">Actividad reciente</h2>
        <div class="space-y-3">
          <div
            v-for="a in actividad.recientes"
            :key="a.id"
            class="flex items-start gap-3 text-sm"
          >
            <Badge color="blue" variant="pill" class="shrink-0">{{
              a.tipo
            }}</Badge>
            <div class="flex-1">
              <p class="font-medium">{{ a.titulo }}</p>
              <p class="text-zinc-400 text-xs">
                {{ new Date(a.createdAt).toLocaleString("es-MX") }}
              </p>
            </div>
          </div>
          <p
            v-if="!loading && !actividad.recientes.length"
            class="text-sm text-zinc-500"
          >
            Sin actividad.
          </p>
        </div>
      </Card>
    </template>

    <!-- ── Programados ── -->
    <template v-else-if="tab === 'programados'">
      <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h2 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Reportes Programados</h2>
        <Btn @click="openScheduleModal(null)" variant="primary" icon="plus">
          Nuevo Programado
        </Btn>
      </div>

      <Card class="p-6">
        <div v-if="loadingSchedules" class="text-sm text-zinc-500">Cargando...</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
              <th class="py-2 pr-3">Nombre</th>
              <th class="py-2 pr-3">Tipo</th>
              <th class="py-2 pr-3">Formato</th>
              <th class="py-2 pr-3">Frecuencia (Cron)</th>
              <th class="py-2 pr-3">Zona Horaria</th>
              <th class="py-2 pr-3">Próxima ejecución</th>
              <th class="py-2 pr-3">Destinatarios</th>
              <th class="py-2 pr-3">Estado</th>
              <th class="py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in schedules"
              :key="s.id"
              class="border-b border-zinc-100 dark:border-zinc-800"
            >
              <td class="py-2 pr-3 font-medium">{{ s.name }}</td>
              <td class="py-2 pr-3">
                <Badge color="blue" variant="pill">{{ s.reportType }}</Badge>
              </td>
              <td class="py-2 pr-3">
                <Badge color="purple" variant="pill">{{ s.format.toUpperCase() }}</Badge>
              </td>
              <td class="py-2 pr-3 font-mono text-xs">{{ s.cron }}</td>
              <td class="py-2 pr-3">{{ s.timezone }}</td>
              <td class="py-2 pr-3">
                <span v-if="s.nextRunAt">{{ formatDateTime(s.nextRunAt) }}</span>
                <span v-else class="text-zinc-400">—</span>
              </td>
              <td class="py-2 pr-3 text-sm">
                <span v-if="s.recipients.length">{{ s.recipients.join(", ") }}</span>
                <span v-else class="text-zinc-400">—</span>
              </td>
              <td class="py-2 pr-3">
                <Badge
                  :color="s.enabled ? 'green' : 'zinc'"
                  variant="pill"
                >{{ s.enabled ? 'Activo' : 'Inactivo' }}</Badge>
              </td>
              <td class="py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <Btn
                    variant="ghost"
                    size="sm"
                    icon="play"
                    @click="runNow(s)"
                    :disabled="runningSchedule === s.id"
                    title="Ejecutar ahora"
                  />
                  <Btn
                    variant="ghost"
                    size="sm"
                    icon="edit"
                    @click="openScheduleModal(s)"
                    title="Editar"
                  />
                  <Btn
                    variant="ghost"
                    size="sm"
                    icon="trash"
                    class="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    @click="deleteSchedule(s)"
                    title="Eliminar"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!loadingSchedules && !schedules.length">
              <td colspan="9" class="py-8 text-center text-zinc-500">
                <p class="mb-2">No hay reportes programados</p>
                <Btn @click="openScheduleModal(null)" variant="primary" icon="plus">
                  Crear el primero
                </Btn>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <!-- Modal Programar Reporte -->
      <Modal
        :open="showScheduleModal"
        max-width="lg"
        content-class="max-h-[90vh] overflow-y-auto"
        @close="closeScheduleModal"
      >
        <template #title>
          <h2 class="text-xl font-bold mb-4">
            {{ editingSchedule ? "Editar Programado" : "Nuevo Reporte Programado" }}
          </h2>
        </template>
        <form @submit.prevent="saveSchedule" class="space-y-4">
          <Field label="Nombre" required>
            <Input
              v-model="scheduleForm.name"
              type="text"
              required
              class="w-full"
              placeholder="Reporte semanal de embudo"
            />
          </Field>

          <Field label="Tipo de reporte" required>
            <Select
              v-model="scheduleForm.reportType"
              :options="reportTypes"
              @update:modelValue="v => scheduleForm.reportType = v"
              class="w-full"
            />
          </Field>

          <Field label="Configuración (JSON)" required>
            <Input
              v-model="scheduleForm.configJson"
              multiline
              :rows="6"
              class="w-full font-mono text-sm"
              placeholder='{"pipelineId": "uuid", "dateRange": "last_30_days"}'
              @input="validateConfig"
            />
            <p v-if="configError" class="text-xs text-red-600 mt-1">{{ configError }}</p>
            <p class="text-xs text-zinc-500 mt-1">
              Configuración específica por tipo. Ej: funnel → pipelineId, dateRange; velocity → dateRange; forecast → monthsAhead
            </p>
          </Field>

          <Field label="Formato">
            <Select
              v-model="scheduleForm.format"
              :options="[
                { value: 'pdf', label: 'PDF' },
                { value: 'excel', label: 'Excel (CSV)' },
                { value: 'json', label: 'JSON' },
              ]"
              @update:modelValue="v => scheduleForm.format = v"
              class="w-full"
            />
          </Field>

          <Field label="Expresión Cron" required>
            <Input
              v-model="scheduleForm.cron"
              type="text"
              required
              class="w-full font-mono text-sm"
              placeholder="0 9 * * 1"
            />
            <p class="text-xs text-zinc-500 mt-1">
              Formato: minuto hora día-mes mes día-semana. Ej: "0 9 * * 1" = cada lunes a las 9:00
            </p>
          </Field>

          <Field label="Zona horaria">
            <Select
              v-model="scheduleForm.timezone"
              :options="timezones"
              @update:modelValue="v => scheduleForm.timezone = v"
              class="w-full"
            />
          </Field>

          <Field label="Destinatarios (emails separados por coma)">
            <Input
              v-model="scheduleForm.recipientsInput"
              type="text"
              class="w-full"
              placeholder="usuario@ejemplo.com, otro@ejemplo.com"
            />
            <p class="text-xs text-zinc-500 mt-1">Deja vacío para no enviar por email</p>
          </Field>

          <Field label="Activo">
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="scheduleForm.enabled"
                class="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <label class="text-sm">Habilitar este reporte programado</label>
            </div>
          </Field>

          <div class="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <Btn
              type="button"
              variant="outline"
              class="flex-1"
              @click="closeScheduleModal"
              >Cancelar</Btn
            >
            <Btn
              type="submit"
              class="flex-1"
              :disabled="savingSchedule || configError"
              :loading="savingSchedule"
              >{{ savingSchedule ? "Guardando..." : (editingSchedule ? "Guardar" : "Crear") }}</Btn
            >
          </div>
        </form>
      </Modal>
    </template>

    <!-- ── Campañas ── -->
    <template v-else>
      <Card class="p-6">
        <h2 class="text-lg font-semibold mb-4">Campañas de email</h2>
        <div v-if="loading" class="text-sm text-zinc-500">Cargando...</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr
              class="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-700"
            >
              <th class="py-2 pr-3">Campaña</th>
              <th class="py-2 pr-3">Estado</th>
              <th class="py-2 pr-3 text-right">Enviados</th>
              <th class="py-2 pr-3 text-right">Aperturas</th>
              <th class="py-2 pr-3 text-right">Clics</th>
              <th class="py-2 text-right">% apertura</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in campanas"
              :key="c.id"
              class="border-b border-zinc-100 dark:border-zinc-800"
            >
              <td class="py-2 pr-3">
                <span class="font-medium">{{ c.nombre }}</span>
                <span class="text-zinc-400"> · {{ c.asunto }}</span>
              </td>
              <td class="py-2 pr-3">
                <Badge
                  :color="c.estado === 'enviada' ? 'green' : 'zinc'"
                  variant="pill"
                  >{{ c.estado }}</Badge
                >
              </td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ c.sent }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ c.opens }}</td>
              <td class="py-2 pr-3 text-right tabular-nums">{{ c.clicks }}</td>
              <td class="py-2 text-right tabular-nums font-medium">
                {{ c.openRate }}%
              </td>
            </tr>
            <tr v-if="!loading && !campanas.length">
              <td colspan="6" class="py-4 text-zinc-500">Sin campañas.</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import Skeleton from "../components/Skeleton.vue";
import Select from "../components/Select.vue";
import { toast } from "../utils/toast";
import Btn from "../components/Btn.vue";
import Icon from "../components/Icon.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import { formatCurrency, loadCurrency, currency } from "../utils/currency";
import StatCard from "../components/StatCard.vue";
import GraficaBarras from "../components/GraficaBarras.vue";
import GraficaDona from "../components/GraficaDona.vue";
import GraficaLinea from "../components/GraficaLinea.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import { confirmar } from "../utils/confirm";

const tabs = [
  { id: "embudo", label: "Embudo" },
  { id: "vendedores", label: "Vendedores" },
  { id: "actividad", label: "Actividad" },
  { id: "campanas", label: "Campañas" },
  { id: "programados", label: "Programados" },
];

const tab = ref("embudo");
const funnel = ref({
  total: 0,
  valorTotal: 0,
  estimadoTotal: 0,
  ticketMedio: 0,
  etapas: [],
});
const pipelines = ref([]);
const pipelineId = ref("");
const loading = ref(true);
const mensual = ref([]);
const vendedores = ref([]);
const actividad = ref({ total: 0, porTipo: [], serie: [], recientes: [] });
const tareas = ref({ porEstado: [], porPrioridad: [], vencidas: 0 });
const colorPrioridad = {
  urgente: "red",
  alta: "orange",
  media: "yellow",
  baja: "green",
};
const campanas = ref([]);

// ── Reportes Programados ──
const schedules = ref([]);
const loadingSchedules = ref(false);
const showScheduleModal = ref(false);
const editingSchedule = ref(null);
const savingSchedule = ref(false);
const runningSchedule = ref(null);
const configError = ref(null);

const scheduleForm = ref({
  name: "",
  reportType: "funnel",
  configJson: '{"dateRange": "last_30_days"}',
  format: "pdf",
  cron: "0 9 * * 1",
  timezone: "America/Mexico_City",
  recipientsInput: "",
  enabled: true,
});

const reportTypes = [
  { value: "funnel", label: "Embudo (Funnel)" },
  { value: "velocity", label: "Velocidad de ventas" },
  { value: "forecast", label: "Forecast / Previsión" },
  { value: "rep-performance", label: "Rendimiento de vendedores" },
  { value: "cohort-retention", label: "Retención de cohortes" },
];

const timezones = [
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Caracas",
  "Europe/Madrid",
  "UTC",
];

function validateConfig() {
  try {
    JSON.parse(scheduleForm.value.configJson);
    configError.value = null;
  } catch (e) {
    configError.value = "JSON inválido: " + e.message;
  }
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const loadSchedules = async () => {
  loadingSchedules.value = true;
  try {
    const { data } = await axios.get("/api/reportes/schedule");
    schedules.value = data.data || data;
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar reportes programados");
  } finally {
    loadingSchedules.value = false;
  }
};

const openScheduleModal = (schedule) => {
  if (schedule) {
    editingSchedule.value = schedule;
    scheduleForm.value = {
      name: schedule.name,
      reportType: schedule.reportType,
      configJson: JSON.stringify(schedule.config, null, 2),
      format: schedule.format,
      cron: schedule.cron,
      timezone: schedule.timezone,
      recipientsInput: schedule.recipients.join(", "),
      enabled: schedule.enabled,
    };
  } else {
    editingSchedule.value = null;
    scheduleForm.value = {
      name: "",
      reportType: "funnel",
      configJson: '{"dateRange": "last_30_days"}',
      format: "pdf",
      cron: "0 9 * * 1",
      timezone: "America/Mexico_City",
      recipientsInput: "",
      enabled: true,
    };
  }
  configError.value = null;
  validateConfig();
  showScheduleModal.value = true;
};

const closeScheduleModal = () => {
  showScheduleModal.value = false;
  editingSchedule.value = null;
};

const saveSchedule = async () => {
  if (configError.value) return;
  savingSchedule.value = true;
  try {
    const payload = {
      name: scheduleForm.value.name,
      reportType: scheduleForm.value.reportType,
      config: JSON.parse(scheduleForm.value.configJson),
      format: scheduleForm.value.format,
      cron: scheduleForm.value.cron,
      timezone: scheduleForm.value.timezone,
      recipients: scheduleForm.value.recipientsInput
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      enabled: scheduleForm.value.enabled,
    };
    if (editingSchedule.value) {
      await axios.put(`/api/reportes/schedule/${editingSchedule.value.id}`, payload);
      toast.success("Reporte programado actualizado");
    } else {
      await axios.post("/api/reportes/schedule", payload);
      toast.success("Reporte programado creado");
    }
    closeScheduleModal();
    await loadSchedules();
  } catch (e) {
    console.error(e);
    toast.error("Error al guardar reporte programado");
  } finally {
    savingSchedule.value = false;
  }
};

const deleteSchedule = async (schedule) => {
  if (!(await confirmar(`¿Eliminar el reporte programado "${schedule.name}"?`))) return;
  try {
    await axios.delete(`/api/reportes/schedule/${schedule.id}`);
    toast.success("Reporte programado eliminado");
    await loadSchedules();
  } catch (e) {
    console.error(e);
    toast.error("Error al eliminar reporte programado");
  }
};

const runNow = async (schedule) => {
  runningSchedule.value = schedule.id;
  try {
    // The backend doesn't have a "run now" endpoint yet, but we can trigger it
    // by temporarily updating the nextRunAt to now
    await axios.post(`/api/reportes/schedule/${schedule.id}/run`);
    toast.success("Reporte ejecutado, se enviará en breve");
  } catch (e) {
    console.error(e);
    toast.error("Error al ejecutar reporte");
  } finally {
    runningSchedule.value = null;
  }
};

const topSellerValor = computed(() =>
  vendedores.value.length ? vendedores.value[0].valorTotal : 0,
);
const totalNegociosVend = computed(() =>
  vendedores.value.reduce((a, v) => a + v.count, 0),
);
const valorTotalVend = computed(() =>
  vendedores.value.reduce((a, v) => a + v.valorTotal, 0),
);
const actividad30 = computed(() =>
  actividad.value.serie.reduce((a, d) => a + d.count, 0),
);

const pct = (count) => {
  const max = Math.max(1, ...(funnel.value.etapas || []).map((e) => e.count));
  return Math.round((count / max) * 100);
};

const loadTab = async () => {
  loading.value = true;
  const params = pipelineId.value ? { pipelineId: pipelineId.value } : {};
  try {
    if (tab.value === "embudo") {
      const [fr, mr] = await Promise.all([
        axios.get("/api/reportes/embudo", { params }),
        axios.get("/api/reportes/mensual", { params: { ...params, meses: 8 } }),
      ]);
      funnel.value = fr.data;
      mensual.value = (mr.data.serie || []).map((m) => ({
        etiqueta: m.nombre,
        valor: m.importe,
        valorFmt: formatCurrency(m.importe),
        extra: `${m.count} negocios`,
        corto: m.count > 0 ? String(m.count) : "",
      }));
    } else if (tab.value === "vendedores") {
      const { data } = await axios.get("/api/reportes/vendedores", {
        params,
      });
      vendedores.value = data.vendedores || [];
    } else if (tab.value === "actividad") {
      const [ar, tr] = await Promise.all([
        axios.get("/api/reportes/actividad"),
        axios.get("/api/reportes/tareas"),
      ]);
      actividad.value = ar.data;
      tareas.value = tr.data;
    } else if (tab.value === "programados") {
      await loadSchedules();
    } else {
      const { data } = await axios.get("/api/reportes/campanas");
      campanas.value = data.campanas || [];
    }
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar reportes");
  } finally {
    loading.value = false;
  }
};

const setTab = (id) => {
  tab.value = id;
  loadTab();
};

const openMetabase = () => {
  window.open("http://localhost:3002", "_blank", "noopener");
};

const exportarPdf = () => {
  window.print();
};

onMounted(async () => {
  await loadCurrency();
  try {
    const { data } = await axios.get("/api/pipelines");
    pipelines.value = data.data || data;
  } catch {
    /* */
  }
  await loadTab();
});
</script>
