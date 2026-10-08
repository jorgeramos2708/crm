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
  numeric,
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
    scimToken: varchar("scim_token", { length: 255 }).unique(),
    ssoConfig: jsonb("sso_config"),
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
    scimTokenIdx: uniqueIndex("tenants_scim_token_idx").on(table.scimToken),
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
    // Revocación de sesiones: se incrementa al cambiar el password.
    // El JWT lleva `v` y el middleware lo compara (mismatch = 401).
    tokenVersion: integer("token_version").notNull().default(0),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "set null",
    }),
    ssoProvider: varchar("sso_provider", { length: 50 }),
    ssoSubject: varchar("sso_subject", { length: 255 }),
    ssoAttributes: jsonb("sso_attributes"),
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
    ssoProviderIdx: index("users_sso_provider_idx").on(table.ssoProvider),
    ssoSubjectIdx: index("users_sso_subject_idx").on(table.ssoSubject),
    tenantIdIdx: index("users_tenant_id_idx").on(table.tenantId),
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

export const oportunidades = pgTable(
  "oportunidades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: varchar("nombre", { length: 200 }).notNull(),
    descripcion: text("descripcion"),
    pipelineId: uuid("pipeline_id")
      .notNull()
      .references(() => pipelines.id, { onDelete: "cascade" }),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => pipelineStages.id, { onDelete: "cascade" }),
    contactoId: uuid("contacto_id").references(() => contactos.id, {
      onDelete: "set null",
    }),
    propietarioId: uuid("propietario_id").references(() => users.id, {
      onDelete: "set null",
    }),
    importe: integer("importe").default(0),
    probabilidad: integer("probabilidad").default(50),
    ivaIncluido: boolean("iva_incluido").notNull().default(false),
    fechaCierreEstimada: timestamp("fecha_cierre_estimada", {
      withTimezone: true,
    }),
    completadoEn: timestamp("completado_en", { withTimezone: true }),
    estadoCierre: varchar("estado_cierre", { length: 20 }).default("abierto"), // 'abierto' | 'ganado' | 'perdido'
    motivoGanado: text("motivo_ganado"),
    motivoPerdido: text("motivo_perdido"),
    cerradoEn: timestamp("cerrado_en", { withTimezone: true }),
    custom: jsonb("custom").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pipelineIdx: index("oportunidades_pipeline_idx").on(table.pipelineId),
    stageIdx: index("oportunidades_stage_idx").on(table.stageId),
    propietarioIdx: index("oportunidades_propietario_idx").on(
      table.propietarioId,
    ),
    estadoCierreIdx: index("oportunidades_estado_cierre_idx").on(
      table.estadoCierre,
    ),
    cerradaEnIdx: index("oportunidades_cerrada_en_idx").on(table.cerradoEn),
  }),
);

export const contactos = pgTable("contactos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  telefono: varchar("telefono", { length: 50 }),
  empresa: varchar("empresa", { length: 100 }),
  cargo: varchar("cargo", { length: 100 }),
  custom: jsonb("custom").notNull().default({}),
  leadScore: integer("lead_score").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  dominio: varchar("dominio", { length: 100 }),
  custom: jsonb("custom").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const microsoftConfig = pgTable("microsoft_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: varchar("client_id", { length: 255 }).notNull().unique(),
  clientSecret: varchar("client_secret", { length: 500 }).notNull(),
  tenantId: varchar("tenant_id", { length: 255 }).notNull().default("common"),
  redirectUri: varchar("redirect_uri", { length: 500 }).notNull(),
  scopes: jsonb("scopes").default([]),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contactCompanies = pgTable(
  "contact_companies",
  {
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contactos.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    id: uuid("id").primaryKey().defaultRandom(),
  },
  (table) => ({
    contactCompanyIdx: uniqueIndex("contact_companies_uc").on(
      table.contactId,
      table.companyId,
    ),
  }),
);

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

export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  templateId: uuid("template_id").references(() => emailTemplates.id),
  remitenteNombre: varchar("remitente_nombre", { length: 100 }).notNull(),
  remitenteEmail: varchar("remitente_email", { length: 255 }).notNull(),
  asunto: varchar("asunto", { length: 200 }).notNull(),
  estado: varchar("estado", { length: 20 }).notNull().default("borrador"),
  programadaPara: timestamp("programada_para", { withTimezone: true }),
  enviadaEn: timestamp("enviada_en", { withTimezone: true }),
  listaId: uuid("lista_id").references(() => contactLists.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const emailThreads = pgTable(
  "email_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 500 }).notNull(),
    participants: jsonb("participants").notNull().default([]),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    messageCount: integer("message_count").default(0).notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    labels: jsonb("labels").default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("email_threads_tenant_idx").on(table.tenantId),
    lastMessageIdx: index("email_threads_last_message_idx").on(
      table.lastMessageAt,
    ),
    assignedIdx: index("email_threads_assigned_idx").on(table.assignedTo),
    isReadIdx: index("email_threads_is_read_idx").on(table.isRead),
  }),
);

export const emailMessages = pgTable(
  "email_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => emailThreads.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    messageId: varchar("message_id", { length: 500 }).notNull(),
    inReplyTo: varchar("in_reply_to", { length: 500 }),
    references: jsonb("references").default([]),
    fromEmail: varchar("from_email", { length: 255 }).notNull(),
    fromName: varchar("from_name", { length: 255 }),
    toEmails: jsonb("to_emails").notNull().default([]),
    ccEmails: jsonb("cc_emails").default([]),
    bccEmails: jsonb("bcc_emails").default([]),
    subject: varchar("subject", { length: 500 }),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    direction: varchar("direction", { length: 10 }).notNull(),
    status: varchar("status", { length: 20 }).default("received"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    trackingId: uuid("tracking_id"),
    headers: jsonb("headers").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    threadIdx: index("email_messages_thread_idx").on(table.threadId),
    messageIdIdx: uniqueIndex("email_messages_message_id_idx").on(
      table.messageId,
    ),
    tenantIdx: index("email_messages_tenant_idx").on(table.tenantId),
    directionIdx: index("email_messages_direction_idx").on(table.direction),
    receivedAtIdx: index("email_messages_received_at_idx").on(table.receivedAt),
  }),
);

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: varchar("tipo", { length: 30 }).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  entityType: varchar("entity_type", { length: 30 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  userId: uuid("user_id").references(() => users.id),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contactLists = pgTable("contact_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contactListMembers = pgTable("contact_list_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  listId: uuid("list_id")
    .notNull()
    .references(() => contactLists.id, { onDelete: "cascade" }),
  contactoId: uuid("contacto_id")
    .notNull()
    .references(() => contactos.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailTracking = pgTable(
  "email_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id").references(() => emailCampaigns.id, {
      onDelete: "set null",
    }),
    contactoId: uuid("contacto_id").references(() => contactos.id, {
      onDelete: "set null",
    }),
    tipo: varchar("tipo", { length: 20 }).notNull(),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    campaignContactIdx: index("email_tracking_campaign_contact_idx").on(
      table.campaignId,
      table.contactoId,
    ),
    tipoIdx: index("email_tracking_tipo_idx").on(table.tipo),
  }),
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("push_subscriptions_tenant_idx").on(table.tenantId),
    userIdx: index("push_subscriptions_user_idx").on(table.userId),
    endpointIdx: uniqueIndex("push_subscriptions_endpoint_idx").on(
      table.endpoint,
    ),
  }),
);

export const emailSubscriptions = pgTable(
  "email_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    contactoId: uuid("contacto_id")
      .notNull()
      .references(() => contactos.id, { onDelete: "cascade" }),
    listaId: uuid("lista_id").references(() => contactLists.id, {
      onDelete: "cascade",
    }),
    estado: varchar("estado", { length: 20 }).notNull().default("pendiente"),
    token: varchar("token", { length: 255 }).notNull().unique(),
    confirmadoEn: timestamp("confirmado_en", { withTimezone: true }),
    canceladoEn: timestamp("cancelado_en", { withTimezone: true }),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("email_subscriptions_token_idx").on(table.token),
    contactoListaIdx: uniqueIndex("email_subscriptions_contacto_lista_idx").on(
      table.contactoId,
      table.listaId,
    ),
  }),
);

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

export const emailSequenceEnrollments = pgTable(
  "email_sequence_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => emailSequences.id, { onDelete: "cascade" }),
    contactoId: uuid("contacto_id")
      .notNull()
      .references(() => contactos.id, { onDelete: "cascade" }),
    pasoActual: integer("paso_actual").default(0).notNull(),
    estado: varchar("estado", { length: 20 }).notNull().default("active"),
    proximoEnvioEn: timestamp("proximo_envio_en", { withTimezone: true }),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sequenceContactIdx: uniqueIndex("email_sequence_enrollments_unique_idx").on(
      table.sequenceId,
      table.contactoId,
    ),
    sequenceIdx: index("email_sequence_enrollments_sequence_idx").on(
      table.sequenceId,
    ),
    contactoIdx: index("email_sequence_enrollments_contacto_idx").on(
      table.contactoId,
    ),
    estadoIdx: index("email_sequence_enrollments_estado_idx").on(table.estado),
    proximoEnvioIdx: index("email_sequence_enrollments_proximo_envio_idx").on(
      table.proximoEnvioEn,
    ),
  }),
);

export const microsoftGraphTokens = pgTable(
  "microsoft_graph_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    scopes: jsonb("scopes").default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("microsoft_graph_tokens_user_idx").on(table.userId),
  }),
);

export const microsoftGraphSubscriptions = pgTable(
  "microsoft_graph_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: varchar("subscription_id", { length: 255 }).notNull(),
    resource: varchar("resource", { length: 255 }).notNull(),
    changeType: varchar("change_type", { length: 50 }).notNull(),
    notificationUrl: text("notification_url").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    clientState: varchar("client_state", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("microsoft_graph_subscriptions_user_idx").on(table.userId),
    subscriptionIdIdx: uniqueIndex(
      "microsoft_graph_subscriptions_subscription_id_idx",
    ).on(table.subscriptionId),
  }),
);

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    prefijo: varchar("prefijo", { length: 16 }).notNull(),
    ultimoUsoEn: timestamp("ultimo_uso_en", { withTimezone: true }),
    expiraEn: timestamp("expira_en", { withTimezone: true }),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("api_tokens_user_idx").on(table.userId),
  }),
);

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  eventos: jsonb("eventos").notNull().default([]),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endpointId: uuid("endpoint_id")
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
    evento: varchar("evento", { length: 100 }).notNull(),
    statusCode: integer("status_code"),
    ok: boolean("ok").notNull().default(false),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    endpointIdx: index("webhook_deliveries_endpoint_idx").on(
      table.endpointId,
      table.createdAt,
    ),
  }),
);

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

export const tareas = pgTable(
  "tareas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titulo: varchar("titulo", { length: 200 }).notNull(),
    descripcion: text("descripcion"),
    estado: varchar("estado", { length: 20 }).notNull().default("pendiente"),
    prioridad: varchar("prioridad", { length: 20 }).notNull().default("media"),
    vencimiento: timestamp("vencimiento", { withTimezone: true }),
    entityType: varchar("entity_type", { length: 30 }),
    entityId: uuid("entity_id"),
    asignadoId: uuid("asignado_id").references(() => users.id, {
      onDelete: "set null",
    }),
    creadoPor: uuid("creado_por").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    entidadIdx: index("tareas_entidad_idx").on(
      table.entityType,
      table.entityId,
    ),
    estadoIdx: index("tareas_estado_idx").on(table.estado),
  }),
);

export const archivos = pgTable(
  "archivos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: varchar("nombre", { length: 255 }).notNull(),
    mime: varchar("mime", { length: 100 }),
    tamano: integer("tamano").notNull().default(0),
    clave: text("clave").notNull(),
    entityType: varchar("entity_type", { length: 30 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    entidadIdx: index("archivos_entidad_idx").on(
      table.entityType,
      table.entityId,
    ),
  }),
);

export const googleConfig = pgTable("google_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: varchar("client_id", { length: 255 }).notNull().unique(),
  clientSecret: varchar("client_secret", { length: 500 }).notNull(),
  redirectUri: varchar("redirect_uri", { length: 500 }).notNull(),
  scopes: jsonb("scopes").notNull().default([]),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const googleTokens = pgTable(
  "google_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    scopes: jsonb("scopes").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("google_tokens_user_idx").on(table.userId),
  }),
);

export const equipos = pgTable("equipos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const equipoMiembros = pgTable(
  "equipo_miembros",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    equipoId: uuid("equipo_id")
      .notNull()
      .references(() => equipos.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    equipoUserIdx: uniqueIndex("equipo_miembros_uc").on(
      table.equipoId,
      table.userId,
    ),
  }),
);

export const vistasGuardadas = pgTable(
  "vistas_guardadas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entidad: varchar("entidad", { length: 20 }).notNull(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    filtros: jsonb("filtros").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("vistas_user_idx").on(table.userId, table.entidad),
  }),
);

export const productos = pgTable("productos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  sku: varchar("sku", { length: 50 }),
  descripcion: text("descripcion"),
  precio: integer("precio").notNull().default(0),
  cobraIva: boolean("cobra_iva").notNull().default(false),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const presupuestos = pgTable(
  "presupuestos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    folio: varchar("folio", { length: 30 }).notNull().unique(),
    oportunidadId: uuid("oportunidad_id").references(() => oportunidades.id, {
      onDelete: "set null",
    }),
    contactoId: uuid("contacto_id").references(() => contactos.id, {
      onDelete: "set null",
    }),
    empresaId: uuid("empresa_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    items: jsonb("items").notNull().default([]),
    subtotal: integer("subtotal").notNull().default(0),
    descuento: integer("descuento").notNull().default(0),
    impuestos: integer("impuestos").notNull().default(0),
    aplicaIva: boolean("aplica_iva").notNull().default(false),
    total: integer("total").notNull().default(0),
    estado: varchar("estado", { length: 20 }).notNull().default("borrador"),
    validez: timestamp("validez", { withTimezone: true }),
    notas: text("notas"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    oportunidadIdx: index("presupuestos_oportunidad_idx").on(
      table.oportunidadId,
    ),
    estadoIdx: index("presupuestos_estado_idx").on(table.estado),
  }),
);

export const permisos = pgTable(
  "permisos",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    modulo: varchar("modulo", { length: 30 }).notNull(),
    r: boolean("r").notNull().default(false),
    w: boolean("w").notNull().default(false),
    x: boolean("x").notNull().default(false),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.modulo] }),
  }),
);

export const ajustes = pgTable("ajustes", {
  clave: text("clave").primaryKey(),
  valor: jsonb("valor").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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

export const fieldPermissions = pgTable(
  "field_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    entity: varchar("entity", { length: 50 }).notNull(),
    field: varchar("field", { length: 100 }).notNull(),
    canRead: boolean("can_read").default(true).notNull(),
    canWrite: boolean("can_write").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("field_permissions_tenant_idx").on(table.tenantId),
    uniqueKey: uniqueIndex("field_permissions_unique_idx").on(
      table.tenantId,
      table.role,
      table.entity,
      table.field,
    ),
  }),
);

export const reportSchedules = pgTable(
  "report_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    reportType: varchar("report_type", { length: 50 }).notNull(),
    config: jsonb("config").default({}),
    format: varchar("format", { length: 20 }).notNull().default("pdf"),
    cron: varchar("cron", { length: 100 }).notNull(),
    timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
    recipients: jsonb("recipients").default([]),
    enabled: boolean("enabled").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("report_schedules_tenant_idx").on(table.tenantId),
    userIdx: index("report_schedules_user_idx").on(table.userId),
    enabledIdx: index("report_schedules_enabled_idx").on(table.enabled),
    nextRunIdx: index("report_schedules_next_run_idx").on(table.nextRunAt),
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

export const meetingSlots = pgTable(
  "meeting_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    meetingTypeId: uuid("meeting_type_id")
      .notNull()
      .references(() => meetingTypes.id, { onDelete: "cascade" }),
    inicio: timestamp("inicio", { withTimezone: true }).notNull(),
    fin: timestamp("fin", { withTimezone: true }).notNull(),
    reservadoPor: uuid("reservado_por").references(() => users.id, {
      onDelete: "set null",
    }),
    invitadoNombre: varchar("invitado_nombre", { length: 200 }),
    invitadoEmail: varchar("invitado_email", { length: 255 }),
    invitadoTelefono: varchar("invitado_telefono", { length: 50 }),
    respuestas: jsonb("respuestas").default({}),
    estado: varchar("estado", { length: 20 }).notNull().default("disponible"),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    meetingTypeIdx: index("meeting_slots_meeting_type_idx").on(
      table.meetingTypeId,
    ),
    inicioIdx: index("meeting_slots_inicio_idx").on(table.inicio),
    estadoIdx: index("meeting_slots_estado_idx").on(table.estado),
    reservadoIdx: index("meeting_slots_reservado_idx").on(table.reservadoPor),
  }),
);

export const meetingTypesRelations = relations(
  meetingTypes,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [meetingTypes.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [meetingTypes.userId],
      references: [users.id],
    }),
    slots: many(meetingSlots),
  }),
);

export const meetingSlotsRelations = relations(meetingSlots, ({ one }) => ({
  meetingType: one(meetingTypes, {
    fields: [meetingSlots.meetingTypeId],
    references: [meetingTypes.id],
  }),
  reservadoPor: one(users, {
    fields: [meetingSlots.reservadoPor],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  oportunidades: many(oportunidades, { relationName: "propietario" }),
  activities: many(activities),
}));

export const pipelinesRelations = relations(pipelines, ({ many }) => ({
  stages: many(pipelineStages),
  oportunidades: many(oportunidades),
}));

export const pipelineStagesRelations = relations(
  pipelineStages,
  ({ one, many }) => ({
    pipeline: one(pipelines, {
      fields: [pipelineStages.pipelineId],
      references: [pipelines.id],
    }),
    oportunidades: many(oportunidades),
  }),
);

export const oportunidadesRelations = relations(oportunidades, ({ one }) => ({
  pipeline: one(pipelines, {
    fields: [oportunidades.pipelineId],
    references: [pipelines.id],
  }),
  stage: one(pipelineStages, {
    fields: [oportunidades.stageId],
    references: [pipelineStages.id],
  }),
  propietario: one(users, {
    fields: [oportunidades.propietarioId],
    references: [users.id],
    relationName: "propietario",
  }),
}));

export const contactCompaniesRelations = relations(
  contactCompanies,
  ({ one }) => ({
    contact: one(contactos, {
      fields: [contactCompanies.contactId],
      references: [contactos.id],
    }),
    company: one(companies, {
      fields: [contactCompanies.companyId],
      references: [companies.id],
    }),
  }),
);

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

// Materialized Views for Dashboard/Reports (refreshed via pg_cron)
export const mvFunnelMetrics = pgTable(
  "mv_funnel_metrics",
  {
    tenantId: uuid("tenant_id").notNull(),
    pipelineId: uuid("pipeline_id").notNull(),
    stageId: uuid("stage_id").notNull(),
    stageName: varchar("stage_name", { length: 100 }).notNull(),
    stageOrder: integer("stage_order").notNull(),
    enteredCount: integer("entered_count").default(0),
    exitedCount: integer("exited_count").default(0),
    conversionRate: numeric("conversion_rate", {
      precision: 5,
      scale: 2,
    }).default("0"),
    avgDaysInStage: numeric("avg_days_in_stage", {
      precision: 8,
      scale: 2,
    }).default("0"),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.tenantId,
        table.pipelineId,
        table.stageId,
        table.periodStart,
        table.periodEnd,
      ],
    }),
    tenantIdx: index("mv_funnel_metrics_tenant_idx").on(table.tenantId),
  }),
);

export const mvVelocity = pgTable(
  "mv_velocity",
  {
    tenantId: uuid("tenant_id").notNull(),
    userId: uuid("user_id").notNull(),
    userName: varchar("user_name", { length: 200 }).notNull(),
    week: timestamp("week", { withTimezone: true }).notNull(),
    dealsClosed: integer("deals_closed").default(0),
    revenue: numeric("revenue", { precision: 14, scale: 2 }).default("0"),
    avgCycleDays: numeric("avg_cycle_days", { precision: 8, scale: 2 }).default(
      "0",
    ),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tenantId, table.userId, table.week] }),
    tenantIdx: index("mv_velocity_tenant_idx").on(table.tenantId),
  }),
);

export const mvForecast = pgTable(
  "mv_forecast",
  {
    tenantId: uuid("tenant_id").notNull(),
    userId: uuid("user_id").notNull(),
    userName: varchar("user_name", { length: 200 }).notNull(),
    month: timestamp("month", { withTimezone: true }).notNull(),
    weightedPipeline: numeric("weighted_pipeline", {
      precision: 14,
      scale: 2,
    }).default("0"),
    dealCount: integer("deal_count").default(0),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tenantId, table.userId, table.month] }),
    tenantIdx: index("mv_forecast_tenant_idx").on(table.tenantId),
  }),
);

export const mvRepPerformance = pgTable(
  "mv_rep_performance",
  {
    tenantId: uuid("tenant_id").notNull(),
    userId: uuid("user_id").notNull(),
    userName: varchar("user_name", { length: 200 }).notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    dealsCreated: integer("deals_created").default(0),
    dealsWon: integer("deals_won").default(0),
    dealsLost: integer("deals_lost").default(0),
    revenueWon: numeric("revenue_won", { precision: 14, scale: 2 }).default(
      "0",
    ),
    avgDealSize: numeric("avg_deal_size", { precision: 14, scale: 2 }).default(
      "0",
    ),
    winRate: numeric("win_rate", { precision: 5, scale: 2 }).default("0"),
    avgCycleDays: numeric("avg_cycle_days", { precision: 8, scale: 2 }).default(
      "0",
    ),
    activitiesCount: integer("activities_count").default(0),
    emailsSent: integer("emails_sent").default(0),
    callsMade: integer("calls_made").default(0),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.tenantId,
        table.userId,
        table.periodStart,
        table.periodEnd,
      ],
    }),
    tenantIdx: index("mv_rep_performance_tenant_idx").on(table.tenantId),
  }),
);

export const mvCohortRetention = pgTable(
  "mv_cohort_retention",
  {
    tenantId: uuid("tenant_id").notNull(),
    cohortMonth: timestamp("cohort_month", { withTimezone: true }).notNull(),
    periodNumber: integer("period_number").notNull(), // 0 = cohort month, 1 = month 1, etc.
    cohortSize: integer("cohort_size").default(0),
    retainedCount: integer("retained_count").default(0),
    retentionRate: numeric("retention_rate", {
      precision: 5,
      scale: 2,
    }).default("0"),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.tenantId, table.cohortMonth, table.periodNumber],
    }),
    tenantIdx: index("mv_cohort_retention_tenant_idx").on(table.tenantId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Pipeline = typeof pipelines.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Oportunidad = typeof oportunidades.$inferSelect;
export type NewOportunidad = typeof oportunidades.$inferInsert;
export type Contacto = typeof contactos.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Automatizacion = typeof automatizaciones.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ContactList = typeof contactLists.$inferSelect;
export type ContactListMember = typeof contactListMembers.$inferSelect;
export type EmailTracking = typeof emailTracking.$inferSelect;
export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type MicrosoftGraphTokens = typeof microsoftGraphTokens.$inferSelect;
export type MicrosoftGraphSubscription =
  typeof microsoftGraphSubscriptions.$inferSelect;
export type MicrosoftConfig = typeof microsoftConfig.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type CustomField = typeof customFields.$inferSelect;
export type Tarea = typeof tareas.$inferSelect;
export type Archivo = typeof archivos.$inferSelect;
export type GoogleConfig = typeof googleConfig.$inferSelect;
export type GoogleTokens = typeof googleTokens.$inferSelect;
export type Equipo = typeof equipos.$inferSelect;
export type VistaGuardada = typeof vistasGuardadas.$inferSelect;
export type Permiso = typeof permisos.$inferSelect;
export type Ajuste = typeof ajustes.$inferSelect;
export type Producto = typeof productos.$inferSelect;
export type Presupuesto = typeof presupuestos.$inferSelect;
export type EmailThread = typeof emailThreads.$inferSelect;
export type EmailMessage = typeof emailMessages.$inferSelect;
export type EmailSequence = typeof emailSequences.$inferSelect;
export type EmailSequenceEnrollment =
  typeof emailSequenceEnrollments.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type FieldPermission = typeof fieldPermissions.$inferSelect;
export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type MeetingType = typeof meetingTypes.$inferSelect;
export type MeetingSlot = typeof meetingSlots.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type LeadScoringRule = typeof leadScoringRules.$inferSelect;
