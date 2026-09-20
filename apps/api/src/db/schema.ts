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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  activoIdx: index('users_activo_idx').on(table.activo),
}));

export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  orden: integer('orden').notNull().default(0),
  esInicial: boolean('es_inicial').notNull().default(false),
  esFinal: boolean('es_final').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const oportunidades = pgTable('oportunidades', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  descripcion: text('descripcion'),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id),
  stageId: uuid('stage_id').notNull().references(() => pipelineStages.id),
  contactoId: uuid('contacto_id'),
  propietarioId: uuid('propietario_id').references(() => users.id),
  importe: integer('importe').default(0),
  probabilidad: integer('probabilidad').default(50),
  fechaCierreEstimada: timestamp('fecha_cierre_estimada', { withTimezone: true }),
  custom: jsonb('custom').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contactos = pgTable('contactos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  telefono: varchar('telefono', { length: 50 }),
  empresa: varchar('empresa', { length: 100 }),
  cargo: varchar('cargo', { length: 100 }),
  custom: jsonb('custom').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  dominio: varchar('dominio', { length: 100 }),
  custom: jsonb('custom').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const microsoftConfig = pgTable('microsoft_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id', { length: 255 }).notNull(),
  clientSecret: varchar('client_secret', { length: 500 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull().default('common'),
  redirectUri: varchar('redirect_uri', { length: 500 }).notNull(),
  scopes: jsonb('scopes').default([]),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contactCompanies = pgTable('contact_companies', {
  contactId: uuid('contact_id').notNull().references(() => contactos.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
});

export const automatizaciones = pgTable('automatizaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  evento: varchar('evento', { length: 50 }).notNull(),
  condiciones: jsonb('condiciones').notNull().default([]),
  acciones: jsonb('acciones').notNull().default([]),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  asunto: varchar('asunto', { length: 200 }).notNull(),
  contenidoHtml: text('contenido_html').notNull(),
  contenidoTexto: text('contenido_texto'),
  variables: jsonb('variables').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  templateId: uuid('template_id').references(() => emailTemplates.id),
  remitenteNombre: varchar('remitente_nombre', { length: 100 }).notNull(),
  remitenteEmail: varchar('remitente_email', { length: 255 }).notNull(),
  asunto: varchar('asunto', { length: 200 }).notNull(),
  estado: varchar('estado', { length: 20 }).notNull().default('borrador'),
  programadaPara: timestamp('programada_para', { withTimezone: true }),
  enviadaEn: timestamp('enviada_en', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tipo: varchar('tipo', { length: 30 }).notNull(),
  titulo: varchar('titulo', { length: 200 }).notNull(),
  descripcion: text('descripcion'),
  entityType: varchar('entity_type', { length: 30 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  userId: uuid('user_id').references(() => users.id),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contactLists = pgTable('contact_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contactListMembers = pgTable('contact_list_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  listId: uuid('list_id').notNull().references(() => contactLists.id, { onDelete: 'cascade' }),
  contactoId: uuid('contacto_id').notNull().references(() => contactos.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
});

export const emailTracking = pgTable('email_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => emailCampaigns.id, { onDelete: 'set null' }),
  contactoId: uuid('contacto_id').references(() => contactos.id, { onDelete: 'set null' }),
  tipo: varchar('tipo', { length: 20 }).notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  campaignContactIdx: index('email_tracking_campaign_contact_idx').on(table.campaignId, table.contactoId),
  tipoIdx: index('email_tracking_tipo_idx').on(table.tipo),
}));

export const emailSubscriptions = pgTable('email_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactoId: uuid('contacto_id').notNull().references(() => contactos.id, { onDelete: 'cascade' }),
  listaId: uuid('lista_id').references(() => contactLists.id, { onDelete: 'cascade' }),
  estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  confirmadoEn: timestamp('confirmado_en', { withTimezone: true }),
  canceladoEn: timestamp('cancelado_en', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex('email_subscriptions_token_idx').on(table.token),
  contactoListaIdx: index('email_subscriptions_contacto_lista_idx').on(table.contactoId, table.listaId),
}));

export const microsoftGraphTokens = pgTable('microsoft_graph_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  scopes: jsonb('scopes').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex('microsoft_graph_tokens_user_idx').on(table.userId),
}));

export const microsoftGraphSubscriptions = pgTable('microsoft_graph_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: varchar('subscription_id', { length: 255 }).notNull(),
  resource: varchar('resource', { length: 255 }).notNull(),
  changeType: varchar('change_type', { length: 50 }).notNull(),
  notificationUrl: text('notification_url').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  clientState: varchar('client_state', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('microsoft_graph_subscriptions_user_idx').on(table.userId),
  subscriptionIdIdx: uniqueIndex('microsoft_graph_subscriptions_subscription_id_idx').on(table.subscriptionId),
}));

export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
  prefijo: varchar('prefijo', { length: 16 }).notNull(),
  ultimoUsoEn: timestamp('ultimo_uso_en', { withTimezone: true }),
  expiraEn: timestamp('expira_en', { withTimezone: true }),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('api_tokens_user_idx').on(table.userId),
}));

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  url: text('url').notNull(),
  secret: varchar('secret', { length: 255 }).notNull(),
  eventos: jsonb('eventos').notNull().default([]),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  endpointId: uuid('endpoint_id').notNull().references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
  evento: varchar('evento', { length: 100 }).notNull(),
  statusCode: integer('status_code'),
  ok: boolean('ok').notNull().default(false),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  endpointIdx: index('webhook_deliveries_endpoint_idx').on(table.endpointId, table.createdAt),
}));

export const customFields = pgTable('custom_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  entidad: varchar('entidad', { length: 20 }).notNull(),
  clave: varchar('clave', { length: 50 }).notNull(),
  etiqueta: varchar('etiqueta', { length: 100 }).notNull(),
  tipo: varchar('tipo', { length: 20 }).notNull().default('texto'),
  opciones: jsonb('opciones').notNull().default([]),
  requerido: boolean('requerido').notNull().default(false),
  orden: integer('orden').notNull().default(0),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tareas = pgTable('tareas', {
  id: uuid('id').primaryKey().defaultRandom(),
  titulo: varchar('titulo', { length: 200 }).notNull(),
  descripcion: text('descripcion'),
  estado: varchar('estado', { length: 20 }).notNull().default('pendiente'),
  prioridad: varchar('prioridad', { length: 20 }).notNull().default('media'),
  vencimiento: timestamp('vencimiento', { withTimezone: true }),
  entityType: varchar('entity_type', { length: 30 }),
  entityId: uuid('entity_id'),
  asignadoId: uuid('asignado_id').references(() => users.id, { onDelete: 'set null' }),
  creadoPor: uuid('creado_por').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entidadIdx: index('tareas_entidad_idx').on(table.entityType, table.entityId),
  estadoIdx: index('tareas_estado_idx').on(table.estado),
}));

export const archivos = pgTable('archivos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 255 }).notNull(),
  mime: varchar('mime', { length: 100 }),
  tamano: integer('tamano').notNull().default(0),
  clave: text('clave').notNull(),
  entityType: varchar('entity_type', { length: 30 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entidadIdx: index('archivos_entidad_idx').on(table.entityType, table.entityId),
}));

export const googleConfig = pgTable('google_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id', { length: 255 }).notNull(),
  clientSecret: varchar('client_secret', { length: 500 }).notNull(),
  redirectUri: varchar('redirect_uri', { length: 500 }).notNull(),
  scopes: jsonb('scopes').notNull().default([]),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const googleTokens = pgTable('google_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  scopes: jsonb('scopes').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex('google_tokens_user_idx').on(table.userId),
}));

export const equipos = pgTable('equipos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const equipoMiembros = pgTable('equipo_miembros', {
  equipoId: uuid('equipo_id').notNull().references(() => equipos.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const vistasGuardadas = pgTable('vistas_guardadas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entidad: varchar('entidad', { length: 20 }).notNull(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  filtros: jsonb('filtros').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('vistas_user_idx').on(table.userId, table.entidad),
}));

export const productos = pgTable('productos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  sku: varchar('sku', { length: 50 }),
  descripcion: text('descripcion'),
  precio: integer('precio').notNull().default(0),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const presupuestos = pgTable('presupuestos', {
  id: uuid('id').primaryKey().defaultRandom(),
  folio: varchar('folio', { length: 30 }).notNull().unique(),
  oportunidadId: uuid('oportunidad_id').references(() => oportunidades.id, { onDelete: 'set null' }),
  contactoId: uuid('contacto_id').references(() => contactos.id, { onDelete: 'set null' }),
  empresaId: uuid('empresa_id').references(() => companies.id, { onDelete: 'set null' }),
  items: jsonb('items').notNull().default([]),
  subtotal: integer('subtotal').notNull().default(0),
  descuento: integer('descuento').notNull().default(0),
  impuestos: integer('impuestos').notNull().default(0),
  total: integer('total').notNull().default(0),
  estado: varchar('estado', { length: 20 }).notNull().default('borrador'),
  validez: timestamp('validez', { withTimezone: true }),
  notas: text('notas'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  oportunidadIdx: index('presupuestos_oportunidad_idx').on(table.oportunidadId),
  estadoIdx: index('presupuestos_estado_idx').on(table.estado),
}));

export const usersRelations = relations(users, ({ many }) => ({
  oportunidades: many(oportunidades, { relationName: 'propietario' }),
  activities: many(activities),
}));

export const pipelinesRelations = relations(pipelines, ({ many }) => ({
  stages: many(pipelineStages),
  oportunidades: many(oportunidades),
}));

export const pipelineStagesRelations = relations(pipelineStages, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [pipelineStages.pipelineId], references: [pipelines.id] }),
  oportunidades: many(oportunidades),
}));

export const oportunidadesRelations = relations(oportunidades, ({ one }) => ({
  pipeline: one(pipelines, { fields: [oportunidades.pipelineId], references: [pipelines.id] }),
  stage: one(pipelineStages, { fields: [oportunidades.stageId], references: [pipelineStages.id] }),
  propietario: one(users, { fields: [oportunidades.propietarioId], references: [users.id], relationName: 'propietario' }),
}));

export const contactCompaniesRelations = relations(contactCompanies, ({ one }) => ({
  contact: one(contactos, { fields: [contactCompanies.contactId], references: [contactos.id] }),
  company: one(companies, { fields: [contactCompanies.companyId], references: [companies.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Pipeline = typeof pipelines.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Oportunidad = typeof oportunidades.$inferSelect;
export type Contacto = typeof contactos.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Automatizacion = typeof automatizaciones.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ContactList = typeof contactLists.$inferSelect;
export type ContactListMember = typeof contactListMembers.$inferSelect;
export type EmailTracking = typeof emailTracking.$inferSelect;
export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type MicrosoftGraphTokens = typeof microsoftGraphTokens.$inferSelect;
export type MicrosoftGraphSubscription = typeof microsoftGraphSubscriptions.$inferSelect;
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
export type Producto = typeof productos.$inferSelect;
export type Presupuesto = typeof presupuestos.$inferSelect;