CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ajustes" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"prefijo" varchar(16) NOT NULL,
	"ultimo_uso_en" timestamp with time zone,
	"expira_en" timestamp with time zone,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "archivos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"mime" varchar(100),
	"tamano" integer DEFAULT 0 NOT NULL,
	"clave" text NOT NULL,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_category" varchar(30) NOT NULL,
	"actor_type" varchar(20) NOT NULL,
	"actor_id" uuid,
	"actor_ip" varchar(45),
	"actor_user_agent" text,
	"target_type" varchar(30),
	"target_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"changed_fields" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"risk_level" varchar(10) DEFAULT 'low',
	"previous_hash" varchar(64),
	"current_hash" varchar(64) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automatizaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"evento" varchar(50) NOT NULL,
	"condiciones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"acciones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"dominio" varchar(100),
	"custom" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_companies" (
	"contact_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_list_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"contacto_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contactos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"email" varchar(255),
	"telefono" varchar(50),
	"empresa" varchar(100),
	"cargo" varchar(100),
	"custom" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"lead_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contactos_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "custom_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidad" varchar(20) NOT NULL,
	"clave" varchar(50) NOT NULL,
	"etiqueta" varchar(100) NOT NULL,
	"tipo" varchar(20) DEFAULT 'texto' NOT NULL,
	"opciones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requerido" boolean DEFAULT false NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"template_id" uuid,
	"remitente_nombre" varchar(100) NOT NULL,
	"remitente_email" varchar(255) NOT NULL,
	"asunto" varchar(200) NOT NULL,
	"estado" varchar(20) DEFAULT 'borrador' NOT NULL,
	"programada_para" timestamp with time zone,
	"enviada_en" timestamp with time zone,
	"lista_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"message_id" varchar(500) NOT NULL,
	"in_reply_to" varchar(500),
	"references" jsonb DEFAULT '[]'::jsonb,
	"from_email" varchar(255) NOT NULL,
	"from_name" varchar(255),
	"to_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cc_emails" jsonb DEFAULT '[]'::jsonb,
	"bcc_emails" jsonb DEFAULT '[]'::jsonb,
	"subject" varchar(500),
	"body_text" text,
	"body_html" text,
	"direction" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'received',
	"sent_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"tracking_id" uuid,
	"headers" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sequence_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" uuid NOT NULL,
	"contacto_id" uuid NOT NULL,
	"paso_actual" integer DEFAULT 0 NOT NULL,
	"estado" varchar(20) DEFAULT 'active' NOT NULL,
	"proximo_envio_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"evento" varchar(50) NOT NULL,
	"condiciones" jsonb DEFAULT '[]'::jsonb,
	"acciones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contacto_id" uuid NOT NULL,
	"lista_id" uuid,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"token" varchar(255) NOT NULL,
	"confirmado_en" timestamp with time zone,
	"cancelado_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_subscriptions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"asunto" varchar(200) NOT NULL,
	"contenido_html" text NOT NULL,
	"contenido_texto" text,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subject" varchar(500) NOT NULL,
	"participants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"assigned_to" uuid,
	"labels" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"contacto_id" uuid,
	"tipo" varchar(20) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipo_miembros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipo_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"entity" varchar(50) NOT NULL,
	"field" varchar(100) NOT NULL,
	"can_read" boolean DEFAULT true NOT NULL,
	"can_write" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"client_secret" varchar(500) NOT NULL,
	"redirect_uri" varchar(500) NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_config_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "google_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_scoring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"reglas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_type_id" uuid NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fin" timestamp with time zone NOT NULL,
	"reservado_por" uuid,
	"invitado_nombre" varchar(200),
	"invitado_email" varchar(255),
	"invitado_telefono" varchar(50),
	"respuestas" jsonb DEFAULT '{}'::jsonb,
	"estado" varchar(20) DEFAULT 'disponible' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"duracion_min" integer DEFAULT 30 NOT NULL,
	"buffer_antes_min" integer DEFAULT 5,
	"buffer_despues_min" integer DEFAULT 5,
	"dias_antelacion_min" integer DEFAULT 1,
	"dias_antelacion_max" integer DEFAULT 60,
	"zona_horaria" varchar(50) DEFAULT 'UTC',
	"preguntas" jsonb DEFAULT '[]'::jsonb,
	"activo" boolean DEFAULT true NOT NULL,
	"slug" varchar(100) NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "microsoft_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"client_secret" varchar(500) NOT NULL,
	"tenant_id" varchar(255) DEFAULT 'common' NOT NULL,
	"redirect_uri" varchar(500) NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "microsoft_config_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "microsoft_graph_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" varchar(255) NOT NULL,
	"resource" varchar(255) NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"notification_url" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"client_state" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microsoft_graph_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mv_cohort_retention" (
	"tenant_id" uuid NOT NULL,
	"cohort_month" timestamp with time zone NOT NULL,
	"period_number" integer NOT NULL,
	"cohort_size" integer DEFAULT 0,
	"retained_count" integer DEFAULT 0,
	"retention_rate" numeric(5, 2) DEFAULT '0',
	"refreshed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "mv_cohort_retention_tenant_id_cohort_month_period_number_pk" PRIMARY KEY("tenant_id","cohort_month","period_number")
);
--> statement-breakpoint
CREATE TABLE "mv_forecast" (
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(200) NOT NULL,
	"month" timestamp with time zone NOT NULL,
	"weighted_pipeline" numeric(14, 2) DEFAULT '0',
	"deal_count" integer DEFAULT 0,
	"refreshed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "mv_forecast_tenant_id_user_id_month_pk" PRIMARY KEY("tenant_id","user_id","month")
);
--> statement-breakpoint
CREATE TABLE "mv_funnel_metrics" (
	"tenant_id" uuid NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"stage_name" varchar(100) NOT NULL,
	"stage_order" integer NOT NULL,
	"entered_count" integer DEFAULT 0,
	"exited_count" integer DEFAULT 0,
	"conversion_rate" numeric(5, 2) DEFAULT '0',
	"avg_days_in_stage" numeric(8, 2) DEFAULT '0',
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"refreshed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "mv_funnel_metrics_tenant_id_pipeline_id_stage_id_period_start_period_end_pk" PRIMARY KEY("tenant_id","pipeline_id","stage_id","period_start","period_end")
);
--> statement-breakpoint
CREATE TABLE "mv_rep_performance" (
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(200) NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"deals_created" integer DEFAULT 0,
	"deals_won" integer DEFAULT 0,
	"deals_lost" integer DEFAULT 0,
	"revenue_won" numeric(14, 2) DEFAULT '0',
	"avg_deal_size" numeric(14, 2) DEFAULT '0',
	"win_rate" numeric(5, 2) DEFAULT '0',
	"avg_cycle_days" numeric(8, 2) DEFAULT '0',
	"activities_count" integer DEFAULT 0,
	"emails_sent" integer DEFAULT 0,
	"calls_made" integer DEFAULT 0,
	"refreshed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "mv_rep_performance_tenant_id_user_id_period_start_period_end_pk" PRIMARY KEY("tenant_id","user_id","period_start","period_end")
);
--> statement-breakpoint
CREATE TABLE "mv_velocity" (
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(200) NOT NULL,
	"week" timestamp with time zone NOT NULL,
	"deals_closed" integer DEFAULT 0,
	"revenue" numeric(14, 2) DEFAULT '0',
	"avg_cycle_days" numeric(8, 2) DEFAULT '0',
	"refreshed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "mv_velocity_tenant_id_user_id_week_pk" PRIMARY KEY("tenant_id","user_id","week")
);
--> statement-breakpoint
CREATE TABLE "oportunidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"descripcion" text,
	"pipeline_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"contacto_id" uuid,
	"propietario_id" uuid,
	"importe" integer DEFAULT 0,
	"probabilidad" integer DEFAULT 50,
	"iva_incluido" boolean DEFAULT false NOT NULL,
	"fecha_cierre_estimada" timestamp with time zone,
	"completado_en" timestamp with time zone,
	"estado_cierre" varchar(20) DEFAULT 'abierto',
	"motivo_ganado" text,
	"motivo_perdido" text,
	"cerrado_en" timestamp with time zone,
	"custom" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permisos" (
	"user_id" uuid NOT NULL,
	"modulo" varchar(30) NOT NULL,
	"r" boolean DEFAULT false NOT NULL,
	"w" boolean DEFAULT false NOT NULL,
	"x" boolean DEFAULT false NOT NULL,
	CONSTRAINT "permisos_user_id_modulo_pk" PRIMARY KEY("user_id","modulo")
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#3b82f6',
	"orden" integer DEFAULT 0 NOT NULL,
	"es_inicial" boolean DEFAULT false NOT NULL,
	"es_final" boolean DEFAULT false NOT NULL,
	"probabilidad" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presupuestos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" varchar(30) NOT NULL,
	"oportunidad_id" uuid,
	"contacto_id" uuid,
	"empresa_id" uuid,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"descuento" integer DEFAULT 0 NOT NULL,
	"impuestos" integer DEFAULT 0 NOT NULL,
	"aplica_iva" boolean DEFAULT false NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"estado" varchar(20) DEFAULT 'borrador' NOT NULL,
	"validez" timestamp with time zone,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presupuestos_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(150) NOT NULL,
	"sku" varchar(50),
	"descripcion" text,
	"precio" integer DEFAULT 0 NOT NULL,
	"cobra_iva" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"format" varchar(20) DEFAULT 'pdf' NOT NULL,
	"cron" varchar(100) NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tareas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descripcion" text,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"prioridad" varchar(20) DEFAULT 'media' NOT NULL,
	"vencimiento" timestamp with time zone,
	"entity_type" varchar(30),
	"entity_id" uuid,
	"asignado_id" uuid,
	"creado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"subdominio" varchar(50) NOT NULL,
	"dominio_personalizado" varchar(100),
	"plan" varchar(20) DEFAULT 'starter' NOT NULL,
	"estado" varchar(20) DEFAULT 'activo' NOT NULL,
	"fecha_activacion" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_vencimiento" timestamp with time zone,
	"configuracion" jsonb DEFAULT '{}'::jsonb,
	"stripe_customer_id" varchar(100),
	"stripe_subscription_id" varchar(100),
	"scim_token" varchar(255),
	"sso_config" jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_subdominio_unique" UNIQUE("subdominio"),
	CONSTRAINT "tenants_dominio_personalizado_unique" UNIQUE("dominio_personalizado"),
	CONSTRAINT "tenants_scim_token_unique" UNIQUE("scim_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"tenant_id" uuid,
	"sso_provider" varchar(50),
	"sso_subject" varchar(255),
	"sso_attributes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vistas_guardadas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entidad" varchar(20) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"filtros" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"evento" varchar(100) NOT NULL,
	"status_code" integer,
	"ok" boolean DEFAULT false NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(255) NOT NULL,
	"eventos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_companies" ADD CONSTRAINT "contact_companies_contact_id_contactos_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contactos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_companies" ADD CONSTRAINT "contact_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_list_members" ADD CONSTRAINT "contact_list_members_list_id_contact_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."contact_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_list_members" ADD CONSTRAINT "contact_list_members_contacto_id_contactos_id_fk" FOREIGN KEY ("contacto_id") REFERENCES "public"."contactos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_lista_id_contact_lists_id_fk" FOREIGN KEY ("lista_id") REFERENCES "public"."contact_lists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_thread_id_email_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."email_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sequence_enrollments" ADD CONSTRAINT "email_sequence_enrollments_sequence_id_email_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."email_sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sequence_enrollments" ADD CONSTRAINT "email_sequence_enrollments_contacto_id_contactos_id_fk" FOREIGN KEY ("contacto_id") REFERENCES "public"."contactos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sequences" ADD CONSTRAINT "email_sequences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscriptions" ADD CONSTRAINT "email_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscriptions" ADD CONSTRAINT "email_subscriptions_contacto_id_contactos_id_fk" FOREIGN KEY ("contacto_id") REFERENCES "public"."contactos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscriptions" ADD CONSTRAINT "email_subscriptions_lista_id_contact_lists_id_fk" FOREIGN KEY ("lista_id") REFERENCES "public"."contact_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_contacto_id_contactos_id_fk" FOREIGN KEY ("contacto_id") REFERENCES "public"."contactos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipo_miembros" ADD CONSTRAINT "equipo_miembros_equipo_id_equipos_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipo_miembros" ADD CONSTRAINT "equipo_miembros_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_permissions" ADD CONSTRAINT "field_permissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_tokens" ADD CONSTRAINT "google_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scoring_rules" ADD CONSTRAINT "lead_scoring_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scoring_rules" ADD CONSTRAINT "lead_scoring_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_slots" ADD CONSTRAINT "meeting_slots_meeting_type_id_meeting_types_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "public"."meeting_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_slots" ADD CONSTRAINT "meeting_slots_reservado_por_users_id_fk" FOREIGN KEY ("reservado_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_types" ADD CONSTRAINT "meeting_types_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_types" ADD CONSTRAINT "meeting_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsoft_graph_subscriptions" ADD CONSTRAINT "microsoft_graph_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsoft_graph_tokens" ADD CONSTRAINT "microsoft_graph_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_contacto_id_contactos_id_fk" FOREIGN KEY ("contacto_id") REFERENCES "public"."contactos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_propietario_id_users_id_fk" FOREIGN KEY ("propietario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_oportunidad_id_oportunidades_id_fk" FOREIGN KEY ("oportunidad_id") REFERENCES "public"."oportunidades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_contacto_id_contactos_id_fk" FOREIGN KEY ("contacto_id") REFERENCES "public"."contactos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_empresa_id_companies_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignado_id_users_id_fk" FOREIGN KEY ("asignado_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_creado_por_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vistas_guardadas" ADD CONSTRAINT "vistas_guardadas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_tokens_user_idx" ON "api_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "archivos_entidad_idx" ON "archivos" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_tenant_idx" ON "audit_log" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_log_event_type_idx" ON "audit_log" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_log_hash_chain_idx" ON "audit_log" USING btree ("previous_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_companies_uc" ON "contact_companies" USING btree ("contact_id","company_id");--> statement-breakpoint
CREATE INDEX "email_messages_thread_idx" ON "email_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_messages_message_id_idx" ON "email_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "email_messages_tenant_idx" ON "email_messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "email_messages_direction_idx" ON "email_messages" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "email_messages_received_at_idx" ON "email_messages" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_sequence_enrollments_unique_idx" ON "email_sequence_enrollments" USING btree ("sequence_id","contacto_id");--> statement-breakpoint
CREATE INDEX "email_sequence_enrollments_sequence_idx" ON "email_sequence_enrollments" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "email_sequence_enrollments_contacto_idx" ON "email_sequence_enrollments" USING btree ("contacto_id");--> statement-breakpoint
CREATE INDEX "email_sequence_enrollments_estado_idx" ON "email_sequence_enrollments" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "email_sequence_enrollments_proximo_envio_idx" ON "email_sequence_enrollments" USING btree ("proximo_envio_en");--> statement-breakpoint
CREATE INDEX "email_sequences_tenant_idx" ON "email_sequences" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "email_sequences_evento_idx" ON "email_sequences" USING btree ("evento");--> statement-breakpoint
CREATE INDEX "email_sequences_activo_idx" ON "email_sequences" USING btree ("activo");--> statement-breakpoint
CREATE UNIQUE INDEX "email_subscriptions_token_idx" ON "email_subscriptions" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "email_subscriptions_contacto_lista_idx" ON "email_subscriptions" USING btree ("contacto_id","lista_id");--> statement-breakpoint
CREATE INDEX "email_threads_tenant_idx" ON "email_threads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "email_threads_last_message_idx" ON "email_threads" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "email_threads_assigned_idx" ON "email_threads" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "email_threads_is_read_idx" ON "email_threads" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "email_tracking_campaign_contact_idx" ON "email_tracking" USING btree ("campaign_id","contacto_id");--> statement-breakpoint
CREATE INDEX "email_tracking_tipo_idx" ON "email_tracking" USING btree ("tipo");--> statement-breakpoint
CREATE UNIQUE INDEX "equipo_miembros_uc" ON "equipo_miembros" USING btree ("equipo_id","user_id");--> statement-breakpoint
CREATE INDEX "field_permissions_tenant_idx" ON "field_permissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "field_permissions_unique_idx" ON "field_permissions" USING btree ("tenant_id","role","entity","field");--> statement-breakpoint
CREATE UNIQUE INDEX "google_tokens_user_idx" ON "google_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lead_scoring_rules_tenant_idx" ON "lead_scoring_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "lead_scoring_rules_activo_idx" ON "lead_scoring_rules" USING btree ("activo");--> statement-breakpoint
CREATE INDEX "meeting_slots_meeting_type_idx" ON "meeting_slots" USING btree ("meeting_type_id");--> statement-breakpoint
CREATE INDEX "meeting_slots_inicio_idx" ON "meeting_slots" USING btree ("inicio");--> statement-breakpoint
CREATE INDEX "meeting_slots_estado_idx" ON "meeting_slots" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "meeting_slots_reservado_idx" ON "meeting_slots" USING btree ("reservado_por");--> statement-breakpoint
CREATE INDEX "meeting_types_tenant_idx" ON "meeting_types" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "meeting_types_user_idx" ON "meeting_types" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_types_slug_idx" ON "meeting_types" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "meeting_types_activo_idx" ON "meeting_types" USING btree ("activo");--> statement-breakpoint
CREATE INDEX "microsoft_graph_subscriptions_user_idx" ON "microsoft_graph_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "microsoft_graph_subscriptions_subscription_id_idx" ON "microsoft_graph_subscriptions" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "microsoft_graph_tokens_user_idx" ON "microsoft_graph_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mv_cohort_retention_tenant_idx" ON "mv_cohort_retention" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mv_forecast_tenant_idx" ON "mv_forecast" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mv_funnel_metrics_tenant_idx" ON "mv_funnel_metrics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mv_rep_performance_tenant_idx" ON "mv_rep_performance" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mv_velocity_tenant_idx" ON "mv_velocity" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "oportunidades_pipeline_idx" ON "oportunidades" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "oportunidades_stage_idx" ON "oportunidades" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "oportunidades_propietario_idx" ON "oportunidades" USING btree ("propietario_id");--> statement-breakpoint
CREATE INDEX "oportunidades_estado_cierre_idx" ON "oportunidades" USING btree ("estado_cierre");--> statement-breakpoint
CREATE INDEX "oportunidades_cerrada_en_idx" ON "oportunidades" USING btree ("cerrado_en");--> statement-breakpoint
CREATE INDEX "presupuestos_oportunidad_idx" ON "presupuestos" USING btree ("oportunidad_id");--> statement-breakpoint
CREATE INDEX "presupuestos_estado_idx" ON "presupuestos" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "push_subscriptions_tenant_idx" ON "push_subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "report_schedules_tenant_idx" ON "report_schedules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "report_schedules_user_idx" ON "report_schedules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "report_schedules_enabled_idx" ON "report_schedules" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "report_schedules_next_run_idx" ON "report_schedules" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "tareas_entidad_idx" ON "tareas" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "tareas_estado_idx" ON "tareas" USING btree ("estado");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_subdominio_idx" ON "tenants" USING btree ("subdominio");--> statement-breakpoint
CREATE INDEX "tenants_estado_idx" ON "tenants" USING btree ("estado");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_scim_token_idx" ON "tenants" USING btree ("scim_token");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_activo_idx" ON "users" USING btree ("activo");--> statement-breakpoint
CREATE INDEX "users_sso_provider_idx" ON "users" USING btree ("sso_provider");--> statement-breakpoint
CREATE INDEX "users_sso_subject_idx" ON "users" USING btree ("sso_subject");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "vistas_user_idx" ON "vistas_guardadas" USING btree ("user_id","entidad");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_endpoint_idx" ON "webhook_deliveries" USING btree ("endpoint_id","created_at");