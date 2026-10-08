import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    subdominio: varchar("subdominio", { length: 50 }).notNull().unique(),
    dominioPersonalizado: varchar("dominio_personalizado", {
      length: 100,
    }).unique(),
    plan: varchar("plan", { length: 20 }).notNull().default("starter"),
    estado: varchar("estado", { length: 20 }).notNull().default("activo"),
    fechaActivacion: timestamp("fecha_activacion", { withTimezone: true })
      .defaultNow()
      .notNull(),
    fechaVencimiento: timestamp("fecha_vencimiento", { withTimezone: true }),
    configuracion: jsonb("configuracion").default({}),
    stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    subdominioIdx: uniqueIndex("tenants_subdominio_idx").on(table.subdominio),
    estadoIdx: index("tenants_estado_idx").on(table.estado),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("user"),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    activoIdx: index("users_activo_idx").on(table.activo),
  }),
);

export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id")
    .notNull()
    .references(() => pipelines.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  orden: integer("orden").notNull().default(0),
  esInicial: boolean("es_inicial").notNull().default(false),
  esFinal: boolean("es_final").notNull().default(false),
  probabilidad: integer("probabilidad").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const automatizaciones = pgTable("automatizaciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  evento: varchar("evento", { length: 50 }).notNull(),
  condiciones: jsonb("condiciones").notNull().default([]),
  acciones: jsonb("acciones").notNull().default([]),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  asunto: varchar("asunto", { length: 200 }).notNull(),
  contenidoHtml: text("contenido_html").notNull(),
  contenidoTexto: text("contenido_texto"),
  variables: jsonb("variables").default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const customFields = pgTable("custom_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  entidad: varchar("entidad", { length: 20 }).notNull(),
  clave: varchar("clave", { length: 50 }).notNull(),
  etiqueta: varchar("etiqueta", { length: 100 }).notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull().default("texto"),
  opciones: jsonb("opciones").notNull().default([]),
  requerido: boolean("requerido").notNull().default(false),
  orden: integer("orden").notNull().default(0),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const leadScoringRules = pgTable(
  "lead_scoring_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    descripcion: text("descripcion"),
    activo: boolean("activo").notNull().default(true),
    reglas: jsonb("reglas").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("lead_scoring_rules_tenant_idx").on(table.tenantId),
    activoIdx: index("lead_scoring_rules_activo_idx").on(table.activo),
  }),
);

export const meetingTypes = pgTable(
  "meeting_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    descripcion: text("descripcion"),
    duracionMin: integer("duracion_min").notNull().default(30),
    bufferAntesMin: integer("buffer_antes_min").default(5),
    bufferDespuesMin: integer("buffer_despues_min").default(5),
    diasAntelacionMin: integer("dias_antelacion_min").default(1),
    diasAntelacionMax: integer("dias_antelacion_max").default(60),
    zonaHoraria: varchar("zona_horaria", { length: 50 }).default("UTC"),
    preguntas: jsonb("preguntas").default([]),
    activo: boolean("activo").notNull().default(true),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("meeting_types_tenant_idx").on(table.tenantId),
    userIdx: index("meeting_types_user_idx").on(table.userId),
    slugIdx: uniqueIndex("meeting_types_slug_idx").on(table.slug),
    activoIdx: index("meeting_types_activo_idx").on(table.activo),
  }),
);

export const emailSequences = pgTable(
  "email_sequences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    descripcion: text("descripcion"),
    evento: varchar("evento", { length: 50 }).notNull(),
    condiciones: jsonb("condiciones").default([]),
    acciones: jsonb("acciones").notNull().default([]),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("email_sequences_tenant_idx").on(table.tenantId),
    eventoIdx: index("email_sequences_evento_idx").on(table.evento),
    activoIdx: index("email_sequences_activo_idx").on(table.activo),
  }),
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull().defaultRandom(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    eventCategory: varchar("event_category", { length: 30 }).notNull(),
    actorType: varchar("actor_type", { length: 20 }).notNull(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorIp: varchar("actor_ip", { length: 45 }),
    actorUserAgent: text("actor_user_agent"),
    targetType: varchar("target_type", { length: 30 }),
    targetId: uuid("target_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    changedFields: jsonb("changed_fields").default([]),
    metadata: jsonb("metadata").default({}),
    riskLevel: varchar("risk_level", { length: 10 }).default("low"),
    previousHash: varchar("previous_hash", { length: 64 }),
    currentHash: varchar("current_hash", { length: 64 }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("audit_log_tenant_idx").on(table.tenantId),
    eventTypeIdx: index("audit_log_event_type_idx").on(table.eventType),
    actorIdx: index("audit_log_actor_idx").on(table.actorId),
    targetIdx: index("audit_log_target_idx").on(
      table.targetType,
      table.targetId,
    ),
    timestampIdx: index("audit_log_timestamp_idx").on(table.timestamp),
    hashChainIdx: index("audit_log_hash_chain_idx").on(table.previousHash),
  }),
);

export const pipelinesRelations = relations(pipelines, ({ many }) => ({
  stages: many(pipelineStages),
}));

export const pipelineStagesRelations = relations(pipelineStages, ({ one }) => ({
  pipeline: one(pipelines, {
    fields: [pipelineStages.pipelineId],
    references: [pipelines.id],
  }),
}));

export type Tenant = typeof tenants.$inferSelect;
export type Pipeline = typeof pipelines.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Automatizacion = typeof automatizaciones.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type CustomField = typeof customFields.$inferSelect;
export type LeadScoringRule = typeof leadScoringRules.$inferSelect;
export type User = typeof users.$inferSelect;
export type MeetingType = typeof meetingTypes.$inferSelect;
export type EmailSequence = typeof emailSequences.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
