import pg from "pg";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://crm:crm_dev_password@postgres:5432/crm",
});

// Bootstrap idempotente regenerado desde la BD de referencia
// (ver scripts/bootstrap-schema.sql y docs de despliegue).
// Seguro re-ejecutar: CREATE ... IF NOT EXISTS + constraints en DO blocks.
const BOOTSTRAP = `--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: _log_marca_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public._log_marca_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.clave LIKE 'marca%' AND (OLD.valor IS DISTINCT FROM NEW.valor) THEN
    INSERT INTO _audit_marca_log(old_val, new_val) VALUES (OLD.valor, NEW.valor);
  END IF;
  RETURN NEW;
END;
$$;




--
-- Name: _audit_marca_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public._audit_marca_log (
    id integer NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL,
    old_val jsonb,
    new_val jsonb,
    app_user text DEFAULT CURRENT_USER
);


--
-- Name: _audit_marca_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE IF NOT EXISTS public._audit_marca_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: _audit_marca_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public._audit_marca_log_id_seq OWNED BY public._audit_marca_log.id;


--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo character varying(30) NOT NULL,
    titulo character varying(200) NOT NULL,
    descripcion text,
    entity_type character varying(30) NOT NULL,
    entity_id uuid NOT NULL,
    user_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ajustes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.ajustes (
    clave text NOT NULL,
    valor jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: api_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.api_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    token_hash character varying(128) NOT NULL,
    prefijo character varying(16) NOT NULL,
    ultimo_uso_en timestamp with time zone,
    expira_en timestamp with time zone,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: archivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.archivos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(255) NOT NULL,
    mime character varying(100),
    tamano integer DEFAULT 0 NOT NULL,
    clave text NOT NULL,
    entity_type character varying(30) NOT NULL,
    entity_id uuid NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(50) NOT NULL,
    event_category character varying(30) NOT NULL,
    actor_type character varying(20) NOT NULL,
    actor_id uuid,
    actor_ip character varying(45),
    actor_user_agent text,
    target_type character varying(30),
    target_id uuid,
    before jsonb,
    after jsonb,
    changed_fields jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    risk_level character varying(10) DEFAULT 'low'::character varying,
    previous_hash character varying(64),
    current_hash character varying(64) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: automatizaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.automatizaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    evento character varying(50) NOT NULL,
    condiciones jsonb DEFAULT '[]'::jsonb NOT NULL,
    acciones jsonb DEFAULT '[]'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    dominio character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: contact_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.contact_companies (
    contact_id uuid NOT NULL,
    company_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: contact_list_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.contact_list_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    list_id uuid NOT NULL,
    contacto_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contact_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.contact_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contactos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.contactos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(255),
    telefono character varying(50),
    empresa character varying(100),
    cargo character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom jsonb DEFAULT '{}'::jsonb NOT NULL,
    tenant_id uuid,
    lead_score integer DEFAULT 0 NOT NULL
);


--
-- Name: custom_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.custom_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entidad character varying(20) NOT NULL,
    clave character varying(50) NOT NULL,
    etiqueta character varying(100) NOT NULL,
    tipo character varying(20) DEFAULT 'texto'::character varying NOT NULL,
    opciones jsonb DEFAULT '[]'::jsonb NOT NULL,
    requerido boolean DEFAULT false NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    template_id uuid,
    remitente_nombre character varying(100) NOT NULL,
    remitente_email character varying(255) NOT NULL,
    asunto character varying(200) NOT NULL,
    estado character varying(20) DEFAULT 'borrador'::character varying NOT NULL,
    programada_para timestamp with time zone,
    enviada_en timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    lista_id uuid
);


--
-- Name: email_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.email_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    message_id character varying(500) NOT NULL,
    in_reply_to character varying(500),
    "references" jsonb DEFAULT '[]'::jsonb,
    from_email character varying(255) NOT NULL,
    from_name character varying(255),
    to_emails jsonb DEFAULT '[]'::jsonb NOT NULL,
    cc_emails jsonb DEFAULT '[]'::jsonb,
    bcc_emails jsonb DEFAULT '[]'::jsonb,
    subject character varying(500),
    body_text text,
    body_html text,
    direction character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'received'::character varying,
    sent_at timestamp with time zone,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    tracking_id uuid,
    headers jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_sequence_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sequence_id uuid NOT NULL,
    contacto_id uuid NOT NULL,
    paso_actual integer DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'active'::character varying NOT NULL,
    proximo_envio_en timestamp with time zone,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.email_sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    evento character varying(50) NOT NULL,
    condiciones jsonb DEFAULT '[]'::jsonb,
    acciones jsonb DEFAULT '[]'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.email_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contacto_id uuid NOT NULL,
    lista_id uuid,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    token character varying(255) NOT NULL,
    confirmado_en timestamp with time zone,
    cancelado_en timestamp with time zone,
    tenant_id uuid,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    asunto character varying(200) NOT NULL,
    contenido_html text NOT NULL,
    contenido_texto text,
    variables jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.email_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    subject character varying(500) NOT NULL,
    participants jsonb DEFAULT '[]'::jsonb NOT NULL,
    last_message_at timestamp with time zone DEFAULT now() NOT NULL,
    message_count integer DEFAULT 0 NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    assigned_to uuid,
    labels jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.email_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid,
    contacto_id uuid,
    tipo character varying(20) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: equipo_miembros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.equipo_miembros (
    equipo_id uuid NOT NULL,
    user_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: equipos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.equipos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: field_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.field_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    entity character varying(50) NOT NULL,
    field character varying(100) NOT NULL,
    can_read boolean DEFAULT true NOT NULL,
    can_write boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: google_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.google_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying(255) NOT NULL,
    client_secret character varying(500) NOT NULL,
    redirect_uri character varying(500) NOT NULL,
    scopes jsonb DEFAULT '[]'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: google_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.google_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    scopes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_scoring_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.lead_scoring_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    reglas jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: meeting_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.meeting_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meeting_type_id uuid NOT NULL,
    inicio timestamp with time zone NOT NULL,
    fin timestamp with time zone NOT NULL,
    reservado_por uuid,
    invitado_nombre character varying(200),
    invitado_email character varying(255),
    invitado_telefono character varying(50),
    respuestas jsonb DEFAULT '{}'::jsonb,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: meeting_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.meeting_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    duracion_min integer DEFAULT 30 NOT NULL,
    buffer_antes_min integer DEFAULT 5,
    buffer_despues_min integer DEFAULT 5,
    dias_antelacion_min integer DEFAULT 1,
    dias_antelacion_max integer DEFAULT 60,
    zona_horaria character varying(50) DEFAULT 'UTC'::character varying,
    preguntas jsonb DEFAULT '[]'::jsonb,
    activo boolean DEFAULT true NOT NULL,
    slug character varying(100) NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: microsoft_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.microsoft_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id character varying(255) NOT NULL,
    client_secret character varying(500) NOT NULL,
    tenant_id character varying(255) DEFAULT 'common'::character varying NOT NULL,
    redirect_uri character varying(500) NOT NULL,
    scopes jsonb DEFAULT '[]'::jsonb,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: microsoft_graph_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.microsoft_graph_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subscription_id character varying(255) NOT NULL,
    resource character varying(255) NOT NULL,
    change_type character varying(50) NOT NULL,
    notification_url text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    client_state character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: microsoft_graph_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.microsoft_graph_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    scopes jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mv_cohort_retention; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.mv_cohort_retention (
    tenant_id uuid NOT NULL,
    cohort_month timestamp with time zone NOT NULL,
    period_number integer NOT NULL,
    cohort_size integer DEFAULT 0,
    retained_count integer DEFAULT 0,
    retention_rate numeric(5,2) DEFAULT '0'::numeric,
    refreshed_at timestamp with time zone DEFAULT now()
);


--
-- Name: mv_forecast; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.mv_forecast (
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_name character varying(200) NOT NULL,
    month timestamp with time zone NOT NULL,
    weighted_pipeline numeric(14,2) DEFAULT '0'::numeric,
    deal_count integer DEFAULT 0,
    refreshed_at timestamp with time zone DEFAULT now()
);


--
-- Name: mv_funnel_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.mv_funnel_metrics (
    tenant_id uuid NOT NULL,
    pipeline_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    stage_name character varying(100) NOT NULL,
    stage_order integer NOT NULL,
    entered_count integer DEFAULT 0,
    exited_count integer DEFAULT 0,
    conversion_rate numeric(5,2) DEFAULT '0'::numeric,
    avg_days_in_stage numeric(8,2) DEFAULT '0'::numeric,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    refreshed_at timestamp with time zone DEFAULT now()
);


--
-- Name: mv_rep_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.mv_rep_performance (
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_name character varying(200) NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    deals_created integer DEFAULT 0,
    deals_won integer DEFAULT 0,
    deals_lost integer DEFAULT 0,
    revenue_won numeric(14,2) DEFAULT '0'::numeric,
    avg_deal_size numeric(14,2) DEFAULT '0'::numeric,
    win_rate numeric(5,2) DEFAULT '0'::numeric,
    avg_cycle_days numeric(8,2) DEFAULT '0'::numeric,
    activities_count integer DEFAULT 0,
    emails_sent integer DEFAULT 0,
    calls_made integer DEFAULT 0,
    refreshed_at timestamp with time zone DEFAULT now()
);


--
-- Name: mv_velocity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.mv_velocity (
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_name character varying(200) NOT NULL,
    week timestamp with time zone NOT NULL,
    deals_closed integer DEFAULT 0,
    revenue numeric(14,2) DEFAULT '0'::numeric,
    avg_cycle_days numeric(8,2) DEFAULT '0'::numeric,
    refreshed_at timestamp with time zone DEFAULT now()
);


--
-- Name: oportunidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.oportunidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(200) NOT NULL,
    descripcion text,
    pipeline_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    contacto_id uuid,
    propietario_id uuid,
    importe integer DEFAULT 0,
    probabilidad integer DEFAULT 50,
    fecha_cierre_estimada timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom jsonb DEFAULT '{}'::jsonb NOT NULL,
    iva_incluido boolean DEFAULT false NOT NULL,
    completado_en timestamp with time zone,
    estado_cierre character varying(20) DEFAULT 'abierto'::character varying,
    motivo_ganado text,
    motivo_perdido text,
    cerrado_en timestamp with time zone
);


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.permisos (
    user_id uuid NOT NULL,
    modulo character varying(30) NOT NULL,
    r boolean DEFAULT false NOT NULL,
    w boolean DEFAULT false NOT NULL,
    x boolean DEFAULT false NOT NULL
);


--
-- Name: pipeline_stages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pipeline_id uuid NOT NULL,
    nombre character varying(50) NOT NULL,
    color character varying(7) DEFAULT '#3b82f6'::character varying,
    orden integer DEFAULT 0 NOT NULL,
    es_inicial boolean DEFAULT false NOT NULL,
    es_final boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    probabilidad integer DEFAULT 50 NOT NULL
);


--
-- Name: pipelines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.pipelines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: presupuestos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.presupuestos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folio character varying(30) NOT NULL,
    oportunidad_id uuid,
    contacto_id uuid,
    empresa_id uuid,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal integer DEFAULT 0 NOT NULL,
    descuento integer DEFAULT 0 NOT NULL,
    impuestos integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'borrador'::character varying NOT NULL,
    validez date,
    notas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    aplica_iva boolean DEFAULT false NOT NULL
);


--
-- Name: presupuestos_folio_seq_2026; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE IF NOT EXISTS public.presupuestos_folio_seq_2026
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.productos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(150) NOT NULL,
    sku character varying(50),
    descripcion text,
    precio integer DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cobra_iva boolean DEFAULT false NOT NULL
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: report_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.report_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    report_type character varying(50) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    format character varying(20) DEFAULT 'pdf'::character varying NOT NULL,
    cron character varying(100) NOT NULL,
    timezone character varying(50) DEFAULT 'UTC'::character varying NOT NULL,
    recipients jsonb DEFAULT '[]'::jsonb,
    enabled boolean DEFAULT true NOT NULL,
    last_run_at timestamp with time zone,
    next_run_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tareas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.tareas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(200) NOT NULL,
    descripcion text,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    prioridad character varying(20) DEFAULT 'media'::character varying NOT NULL,
    vencimiento timestamp with time zone,
    entity_type character varying(30),
    entity_id uuid,
    asignado_id uuid,
    creado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    subdominio character varying(50) NOT NULL,
    dominio_personalizado character varying(100),
    plan character varying(20) DEFAULT 'starter'::character varying NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    fecha_activacion timestamp with time zone DEFAULT now() NOT NULL,
    fecha_vencimiento timestamp with time zone,
    configuracion jsonb DEFAULT '{}'::jsonb,
    stripe_customer_id character varying(100),
    stripe_subscription_id character varying(100),
    scim_token character varying(255),
    sso_config jsonb,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    sso_provider character varying(50),
    sso_subject character varying(255),
    sso_attributes jsonb,
    token_version integer DEFAULT 0 NOT NULL
);


--
-- Name: vistas_guardadas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.vistas_guardadas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entidad character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    filtros jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: webhook_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    endpoint_id uuid NOT NULL,
    evento character varying(100) NOT NULL,
    status_code integer,
    ok boolean DEFAULT false NOT NULL,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: webhook_endpoints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    url text NOT NULL,
    secret character varying(255) NOT NULL,
    eventos jsonb DEFAULT '[]'::jsonb NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: _audit_marca_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._audit_marca_log ALTER COLUMN id SET DEFAULT nextval('public._audit_marca_log_id_seq'::regclass);


--
-- Name: _audit_marca_log _audit_marca_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._audit_marca_log
    ADD CONSTRAINT _audit_marca_log_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: ajustes ajustes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes
    ADD CONSTRAINT ajustes_pkey PRIMARY KEY (clave);


--
-- Name: api_tokens api_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_pkey PRIMARY KEY (id);


--
-- Name: api_tokens api_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: archivos archivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archivos
    ADD CONSTRAINT archivos_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: automatizaciones automatizaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automatizaciones
    ADD CONSTRAINT automatizaciones_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: contact_companies contact_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_companies
    ADD CONSTRAINT contact_companies_pkey PRIMARY KEY (id);


--
-- Name: contact_list_members contact_list_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_pkey PRIMARY KEY (id);


--
-- Name: contact_lists contact_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_lists
    ADD CONSTRAINT contact_lists_pkey PRIMARY KEY (id);


--
-- Name: contactos contactos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos
    ADD CONSTRAINT contactos_pkey PRIMARY KEY (id);


--
-- Name: custom_fields custom_fields_entidad_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_fields
    ADD CONSTRAINT custom_fields_entidad_clave_key UNIQUE (entidad, clave);


--
-- Name: custom_fields custom_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_fields
    ADD CONSTRAINT custom_fields_pkey PRIMARY KEY (id);


--
-- Name: email_campaigns email_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_pkey PRIMARY KEY (id);


--
-- Name: email_messages email_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_pkey PRIMARY KEY (id);


--
-- Name: email_sequence_enrollments email_sequence_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_sequence_enrollments
    ADD CONSTRAINT email_sequence_enrollments_pkey PRIMARY KEY (id);


--
-- Name: email_sequences email_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_sequences
    ADD CONSTRAINT email_sequences_pkey PRIMARY KEY (id);


--
-- Name: email_subscriptions email_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: email_subscriptions email_subscriptions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_token_key UNIQUE (token);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_threads email_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_threads
    ADD CONSTRAINT email_threads_pkey PRIMARY KEY (id);


--
-- Name: email_tracking email_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tracking
    ADD CONSTRAINT email_tracking_pkey PRIMARY KEY (id);


--
-- Name: equipo_miembros equipo_miembros_equipo_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_equipo_id_user_id_key UNIQUE (equipo_id, user_id);


--
-- Name: equipo_miembros equipo_miembros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_pkey PRIMARY KEY (id);


--
-- Name: equipos equipos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_pkey PRIMARY KEY (id);


--
-- Name: field_permissions field_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_permissions
    ADD CONSTRAINT field_permissions_pkey PRIMARY KEY (id);


--
-- Name: google_config google_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_config
    ADD CONSTRAINT google_config_pkey PRIMARY KEY (id);


--
-- Name: google_tokens google_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_tokens
    ADD CONSTRAINT google_tokens_pkey PRIMARY KEY (id);


--
-- Name: lead_scoring_rules lead_scoring_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scoring_rules
    ADD CONSTRAINT lead_scoring_rules_pkey PRIMARY KEY (id);


--
-- Name: meeting_slots meeting_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_slots
    ADD CONSTRAINT meeting_slots_pkey PRIMARY KEY (id);


--
-- Name: meeting_types meeting_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_types
    ADD CONSTRAINT meeting_types_pkey PRIMARY KEY (id);


--
-- Name: meeting_types meeting_types_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_types
    ADD CONSTRAINT meeting_types_slug_unique UNIQUE (slug);


--
-- Name: microsoft_config microsoft_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_config
    ADD CONSTRAINT microsoft_config_pkey PRIMARY KEY (id);


--
-- Name: microsoft_graph_subscriptions microsoft_graph_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_graph_subscriptions
    ADD CONSTRAINT microsoft_graph_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: microsoft_graph_tokens microsoft_graph_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_graph_tokens
    ADD CONSTRAINT microsoft_graph_tokens_pkey PRIMARY KEY (id);


--
-- Name: mv_cohort_retention mv_cohort_retention_tenant_id_cohort_month_period_number_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mv_cohort_retention
    ADD CONSTRAINT mv_cohort_retention_tenant_id_cohort_month_period_number_pk PRIMARY KEY (tenant_id, cohort_month, period_number);


--
-- Name: mv_forecast mv_forecast_tenant_id_user_id_month_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mv_forecast
    ADD CONSTRAINT mv_forecast_tenant_id_user_id_month_pk PRIMARY KEY (tenant_id, user_id, month);


--
-- Name: mv_funnel_metrics mv_funnel_metrics_tenant_id_pipeline_id_stage_id_period_start_p; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mv_funnel_metrics
    ADD CONSTRAINT mv_funnel_metrics_tenant_id_pipeline_id_stage_id_period_start_p PRIMARY KEY (tenant_id, pipeline_id, stage_id, period_start, period_end);


--
-- Name: mv_rep_performance mv_rep_performance_tenant_id_user_id_period_start_period_end_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mv_rep_performance
    ADD CONSTRAINT mv_rep_performance_tenant_id_user_id_period_start_period_end_pk PRIMARY KEY (tenant_id, user_id, period_start, period_end);


--
-- Name: mv_velocity mv_velocity_tenant_id_user_id_week_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mv_velocity
    ADD CONSTRAINT mv_velocity_tenant_id_user_id_week_pk PRIMARY KEY (tenant_id, user_id, week);


--
-- Name: oportunidades oportunidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (user_id, modulo);


--
-- Name: pipeline_stages pipeline_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id);


--
-- Name: pipelines pipelines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT pipelines_pkey PRIMARY KEY (id);


--
-- Name: presupuestos presupuestos_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_folio_key UNIQUE (folio);


--
-- Name: presupuestos presupuestos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: report_schedules report_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_pkey PRIMARY KEY (id);


--
-- Name: tareas tareas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_dominio_personalizado_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_dominio_personalizado_unique UNIQUE (dominio_personalizado);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_scim_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_scim_token_unique UNIQUE (scim_token);


--
-- Name: tenants tenants_subdominio_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_subdominio_unique UNIQUE (subdominio);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vistas_guardadas vistas_guardadas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas_guardadas
    ADD CONSTRAINT vistas_guardadas_pkey PRIMARY KEY (id);


--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: webhook_endpoints webhook_endpoints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_endpoints
    ADD CONSTRAINT webhook_endpoints_pkey PRIMARY KEY (id);


--
-- Name: api_tokens_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS api_tokens_user_idx ON public.api_tokens USING btree (user_id);


--
-- Name: archivos_entidad_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS archivos_entidad_idx ON public.archivos USING btree (entity_type, entity_id);


--
-- Name: audit_log_actor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON public.audit_log USING btree (actor_id);


--
-- Name: audit_log_event_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS audit_log_event_type_idx ON public.audit_log USING btree (event_type);


--
-- Name: audit_log_hash_chain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS audit_log_hash_chain_idx ON public.audit_log USING btree (previous_hash);


--
-- Name: audit_log_target_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS audit_log_target_idx ON public.audit_log USING btree (target_type, target_id);


--
-- Name: audit_log_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS audit_log_tenant_idx ON public.audit_log USING btree (tenant_id);


--
-- Name: audit_log_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx ON public.audit_log USING btree ("timestamp");


--
-- Name: contact_companies_company_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS contact_companies_company_idx ON public.contact_companies USING btree (company_id);


--
-- Name: contact_companies_uc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS contact_companies_uc ON public.contact_companies USING btree (contact_id, company_id);


--
-- Name: contact_companies_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS contact_companies_unique_idx ON public.contact_companies USING btree (contact_id, company_id);


--
-- Name: contactos_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS contactos_tenant_id_idx ON public.contactos USING btree (tenant_id);


--
-- Name: email_messages_direction_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_messages_direction_idx ON public.email_messages USING btree (direction);


--
-- Name: email_messages_message_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS email_messages_message_id_idx ON public.email_messages USING btree (message_id);


--
-- Name: email_messages_received_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_messages_received_at_idx ON public.email_messages USING btree (received_at);


--
-- Name: email_messages_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_messages_tenant_idx ON public.email_messages USING btree (tenant_id);


--
-- Name: email_messages_thread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_messages_thread_idx ON public.email_messages USING btree (thread_id);


--
-- Name: email_sequence_enrollments_contacto_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_sequence_enrollments_contacto_idx ON public.email_sequence_enrollments USING btree (contacto_id);


--
-- Name: email_sequence_enrollments_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_sequence_enrollments_estado_idx ON public.email_sequence_enrollments USING btree (estado);


--
-- Name: email_sequence_enrollments_proximo_envio_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_sequence_enrollments_proximo_envio_idx ON public.email_sequence_enrollments USING btree (proximo_envio_en);


--
-- Name: email_sequence_enrollments_sequence_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_sequence_enrollments_sequence_idx ON public.email_sequence_enrollments USING btree (sequence_id);


--
-- Name: email_sequence_enrollments_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS email_sequence_enrollments_unique_idx ON public.email_sequence_enrollments USING btree (sequence_id, contacto_id);


--
-- Name: email_sequences_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_sequences_activo_idx ON public.email_sequences USING btree (activo);


--
-- Name: email_sequences_evento_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_sequences_evento_idx ON public.email_sequences USING btree (evento);


--
-- Name: email_sequences_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_sequences_tenant_idx ON public.email_sequences USING btree (tenant_id);


--
-- Name: email_subscriptions_contacto_lista_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_subscriptions_contacto_lista_idx ON public.email_subscriptions USING btree (contacto_id, lista_id);


--
-- Name: email_subscriptions_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS email_subscriptions_token_idx ON public.email_subscriptions USING btree (token);


--
-- Name: email_threads_assigned_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_threads_assigned_idx ON public.email_threads USING btree (assigned_to);


--
-- Name: email_threads_is_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_threads_is_read_idx ON public.email_threads USING btree (is_read);


--
-- Name: email_threads_last_message_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_threads_last_message_idx ON public.email_threads USING btree (last_message_at);


--
-- Name: email_threads_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_threads_tenant_idx ON public.email_threads USING btree (tenant_id);


--
-- Name: email_tracking_campaign_contact_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_tracking_campaign_contact_idx ON public.email_tracking USING btree (campaign_id, contacto_id);


--
-- Name: email_tracking_tipo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS email_tracking_tipo_idx ON public.email_tracking USING btree (tipo);


--
-- Name: equipo_miembros_uc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS equipo_miembros_uc ON public.equipo_miembros USING btree (equipo_id, user_id);


--
-- Name: field_permissions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS field_permissions_tenant_idx ON public.field_permissions USING btree (tenant_id);


--
-- Name: field_permissions_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS field_permissions_unique_idx ON public.field_permissions USING btree (tenant_id, role, entity, field);


--
-- Name: google_tokens_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS google_tokens_user_idx ON public.google_tokens USING btree (user_id);


--
-- Name: lead_scoring_rules_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS lead_scoring_rules_activo_idx ON public.lead_scoring_rules USING btree (activo);


--
-- Name: lead_scoring_rules_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS lead_scoring_rules_tenant_idx ON public.lead_scoring_rules USING btree (tenant_id);


--
-- Name: meeting_slots_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS meeting_slots_estado_idx ON public.meeting_slots USING btree (estado);


--
-- Name: meeting_slots_inicio_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS meeting_slots_inicio_idx ON public.meeting_slots USING btree (inicio);


--
-- Name: meeting_slots_meeting_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS meeting_slots_meeting_type_idx ON public.meeting_slots USING btree (meeting_type_id);


--
-- Name: meeting_slots_reservado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS meeting_slots_reservado_idx ON public.meeting_slots USING btree (reservado_por);


--
-- Name: meeting_slots_tipo_inicio_ux; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS meeting_slots_tipo_inicio_ux ON public.meeting_slots USING btree (meeting_type_id, inicio);


--
-- Name: meeting_types_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS meeting_types_activo_idx ON public.meeting_types USING btree (activo);


--
-- Name: meeting_types_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS meeting_types_slug_idx ON public.meeting_types USING btree (slug);


--
-- Name: meeting_types_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS meeting_types_tenant_idx ON public.meeting_types USING btree (tenant_id);


--
-- Name: meeting_types_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS meeting_types_user_idx ON public.meeting_types USING btree (user_id);


--
-- Name: microsoft_graph_subscriptions_subscription_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS microsoft_graph_subscriptions_subscription_id_idx ON public.microsoft_graph_subscriptions USING btree (subscription_id);


--
-- Name: microsoft_graph_subscriptions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS microsoft_graph_subscriptions_user_id_idx ON public.microsoft_graph_subscriptions USING btree (user_id);


--
-- Name: microsoft_graph_subscriptions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS microsoft_graph_subscriptions_user_idx ON public.microsoft_graph_subscriptions USING btree (user_id);


--
-- Name: microsoft_graph_tokens_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS microsoft_graph_tokens_user_idx ON public.microsoft_graph_tokens USING btree (user_id);


--
-- Name: mv_cohort_retention_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS mv_cohort_retention_tenant_idx ON public.mv_cohort_retention USING btree (tenant_id);


--
-- Name: mv_forecast_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS mv_forecast_tenant_idx ON public.mv_forecast USING btree (tenant_id);


--
-- Name: mv_funnel_metrics_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS mv_funnel_metrics_tenant_idx ON public.mv_funnel_metrics USING btree (tenant_id);


--
-- Name: mv_rep_performance_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS mv_rep_performance_tenant_idx ON public.mv_rep_performance USING btree (tenant_id);


--
-- Name: mv_velocity_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS mv_velocity_tenant_idx ON public.mv_velocity USING btree (tenant_id);


--
-- Name: oportunidades_cerrada_en_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS oportunidades_cerrada_en_idx ON public.oportunidades USING btree (cerrado_en);


--
-- Name: oportunidades_estado_cierre_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS oportunidades_estado_cierre_idx ON public.oportunidades USING btree (estado_cierre);


--
-- Name: oportunidades_pipeline_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS oportunidades_pipeline_idx ON public.oportunidades USING btree (pipeline_id);


--
-- Name: oportunidades_propietario_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS oportunidades_propietario_idx ON public.oportunidades USING btree (propietario_id);


--
-- Name: oportunidades_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS oportunidades_stage_idx ON public.oportunidades USING btree (stage_id);


--
-- Name: presupuestos_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS presupuestos_estado_idx ON public.presupuestos USING btree (estado);


--
-- Name: presupuestos_oportunidad_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS presupuestos_oportunidad_idx ON public.presupuestos USING btree (oportunidad_id);


--
-- Name: push_subscriptions_endpoint_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON public.push_subscriptions USING btree (endpoint);


--
-- Name: push_subscriptions_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS push_subscriptions_tenant_idx ON public.push_subscriptions USING btree (tenant_id);


--
-- Name: push_subscriptions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions USING btree (user_id);


--
-- Name: report_schedules_enabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS report_schedules_enabled_idx ON public.report_schedules USING btree (enabled);


--
-- Name: report_schedules_next_run_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS report_schedules_next_run_idx ON public.report_schedules USING btree (next_run_at);


--
-- Name: report_schedules_tenant_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS report_schedules_tenant_idx ON public.report_schedules USING btree (tenant_id);


--
-- Name: report_schedules_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS report_schedules_user_idx ON public.report_schedules USING btree (user_id);


--
-- Name: tareas_entidad_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS tareas_entidad_idx ON public.tareas USING btree (entity_type, entity_id);


--
-- Name: tareas_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS tareas_estado_idx ON public.tareas USING btree (estado);


--
-- Name: tenants_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS tenants_estado_idx ON public.tenants USING btree (estado);


--
-- Name: tenants_scim_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS tenants_scim_token_idx ON public.tenants USING btree (scim_token);


--
-- Name: tenants_subdominio_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS tenants_subdominio_idx ON public.tenants USING btree (subdominio);


--
-- Name: users_activo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS users_activo_idx ON public.users USING btree (activo);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users USING btree (email);


--
-- Name: users_sso_provider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS users_sso_provider_idx ON public.users USING btree (sso_provider);


--
-- Name: users_sso_subject_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS users_sso_subject_idx ON public.users USING btree (sso_subject);


--
-- Name: users_tenant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON public.users USING btree (tenant_id);


--
-- Name: vistas_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS vistas_user_idx ON public.vistas_guardadas USING btree (user_id, entidad);


--
-- Name: webhook_deliveries_endpoint_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS webhook_deliveries_endpoint_idx ON public.webhook_deliveries USING btree (endpoint_id, created_at DESC);


--
-- Name: ajustes trg_audit_marca; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS trg_audit_marca ON public.ajustes;
CREATE TRIGGER trg_audit_marca AFTER UPDATE ON public.ajustes FOR EACH ROW EXECUTE FUNCTION public._log_marca_change();


--
-- Name: activities activities_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: api_tokens api_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: api_tokens api_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_tokens
    ADD CONSTRAINT api_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: archivos archivos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archivos
    ADD CONSTRAINT archivos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: archivos archivos_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.archivos
    ADD CONSTRAINT archivos_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_log audit_log_actor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_actor_id_users_id_fk FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_log audit_log_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contact_companies contact_companies_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_companies
    ADD CONSTRAINT contact_companies_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: contact_companies contact_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_companies
    ADD CONSTRAINT contact_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: contact_companies contact_companies_contact_id_contactos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_companies
    ADD CONSTRAINT contact_companies_contact_id_contactos_id_fk FOREIGN KEY (contact_id) REFERENCES public.contactos(id) ON DELETE CASCADE;


--
-- Name: contact_companies contact_companies_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_companies
    ADD CONSTRAINT contact_companies_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contactos(id) ON DELETE CASCADE;


--
-- Name: contact_list_members contact_list_members_contacto_id_contactos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_contacto_id_contactos_id_fk FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE CASCADE;


--
-- Name: contact_list_members contact_list_members_contacto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE CASCADE;


--
-- Name: contact_list_members contact_list_members_list_id_contact_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_list_id_contact_lists_id_fk FOREIGN KEY (list_id) REFERENCES public.contact_lists(id) ON DELETE CASCADE;


--
-- Name: contact_list_members contact_list_members_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_list_members
    ADD CONSTRAINT contact_list_members_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.contact_lists(id) ON DELETE CASCADE;


--
-- Name: contactos contactos_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos
    ADD CONSTRAINT contactos_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: email_campaigns email_campaigns_lista_id_contact_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_lista_id_contact_lists_id_fk FOREIGN KEY (lista_id) REFERENCES public.contact_lists(id) ON DELETE SET NULL;


--
-- Name: email_campaigns email_campaigns_lista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_lista_id_fkey FOREIGN KEY (lista_id) REFERENCES public.contact_lists(id) ON DELETE SET NULL;


--
-- Name: email_campaigns email_campaigns_template_id_email_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_template_id_email_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.email_templates(id);


--
-- Name: email_campaigns email_campaigns_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_campaigns
    ADD CONSTRAINT email_campaigns_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.email_templates(id);


--
-- Name: email_messages email_messages_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: email_messages email_messages_thread_id_email_threads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_messages
    ADD CONSTRAINT email_messages_thread_id_email_threads_id_fk FOREIGN KEY (thread_id) REFERENCES public.email_threads(id) ON DELETE CASCADE;


--
-- Name: email_sequence_enrollments email_sequence_enrollments_contacto_id_contactos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_sequence_enrollments
    ADD CONSTRAINT email_sequence_enrollments_contacto_id_contactos_id_fk FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE CASCADE;


--
-- Name: email_sequence_enrollments email_sequence_enrollments_sequence_id_email_sequences_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_sequence_enrollments
    ADD CONSTRAINT email_sequence_enrollments_sequence_id_email_sequences_id_fk FOREIGN KEY (sequence_id) REFERENCES public.email_sequences(id) ON DELETE CASCADE;


--
-- Name: email_sequences email_sequences_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_sequences
    ADD CONSTRAINT email_sequences_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: email_subscriptions email_subscriptions_contacto_id_contactos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_contacto_id_contactos_id_fk FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE CASCADE;


--
-- Name: email_subscriptions email_subscriptions_contacto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE CASCADE;


--
-- Name: email_subscriptions email_subscriptions_lista_id_contact_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_lista_id_contact_lists_id_fk FOREIGN KEY (lista_id) REFERENCES public.contact_lists(id) ON DELETE CASCADE;


--
-- Name: email_subscriptions email_subscriptions_lista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_lista_id_fkey FOREIGN KEY (lista_id) REFERENCES public.contact_lists(id) ON DELETE CASCADE;


--
-- Name: email_subscriptions email_subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_subscriptions
    ADD CONSTRAINT email_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: email_threads email_threads_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_threads
    ADD CONSTRAINT email_threads_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: email_threads email_threads_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_threads
    ADD CONSTRAINT email_threads_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: email_tracking email_tracking_campaign_id_email_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tracking
    ADD CONSTRAINT email_tracking_campaign_id_email_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.email_campaigns(id) ON DELETE SET NULL;


--
-- Name: email_tracking email_tracking_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tracking
    ADD CONSTRAINT email_tracking_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.email_campaigns(id) ON DELETE SET NULL;


--
-- Name: email_tracking email_tracking_contacto_id_contactos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tracking
    ADD CONSTRAINT email_tracking_contacto_id_contactos_id_fk FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE SET NULL;


--
-- Name: email_tracking email_tracking_contacto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_tracking
    ADD CONSTRAINT email_tracking_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE SET NULL;


--
-- Name: equipo_miembros equipo_miembros_equipo_id_equipos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_equipo_id_equipos_id_fk FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON DELETE CASCADE;


--
-- Name: equipo_miembros equipo_miembros_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON DELETE CASCADE;


--
-- Name: equipo_miembros equipo_miembros_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: equipo_miembros equipo_miembros_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: field_permissions field_permissions_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_permissions
    ADD CONSTRAINT field_permissions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: google_tokens google_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_tokens
    ADD CONSTRAINT google_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: google_tokens google_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_tokens
    ADD CONSTRAINT google_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lead_scoring_rules lead_scoring_rules_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scoring_rules
    ADD CONSTRAINT lead_scoring_rules_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: lead_scoring_rules lead_scoring_rules_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_scoring_rules
    ADD CONSTRAINT lead_scoring_rules_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: meeting_slots meeting_slots_meeting_type_id_meeting_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_slots
    ADD CONSTRAINT meeting_slots_meeting_type_id_meeting_types_id_fk FOREIGN KEY (meeting_type_id) REFERENCES public.meeting_types(id) ON DELETE CASCADE;


--
-- Name: meeting_slots meeting_slots_reservado_por_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_slots
    ADD CONSTRAINT meeting_slots_reservado_por_users_id_fk FOREIGN KEY (reservado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: meeting_types meeting_types_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_types
    ADD CONSTRAINT meeting_types_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: meeting_types meeting_types_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meeting_types
    ADD CONSTRAINT meeting_types_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: microsoft_graph_subscriptions microsoft_graph_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_graph_subscriptions
    ADD CONSTRAINT microsoft_graph_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: microsoft_graph_subscriptions microsoft_graph_subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_graph_subscriptions
    ADD CONSTRAINT microsoft_graph_subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: microsoft_graph_tokens microsoft_graph_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_graph_tokens
    ADD CONSTRAINT microsoft_graph_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: microsoft_graph_tokens microsoft_graph_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microsoft_graph_tokens
    ADD CONSTRAINT microsoft_graph_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oportunidades oportunidades_contacto_id_contactos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_contacto_id_contactos_id_fk FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE SET NULL;


--
-- Name: oportunidades oportunidades_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);


--
-- Name: oportunidades oportunidades_pipeline_id_pipelines_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_pipeline_id_pipelines_id_fk FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: oportunidades oportunidades_propietario_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_propietario_id_users_id_fk FOREIGN KEY (propietario_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: oportunidades oportunidades_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id);


--
-- Name: oportunidades oportunidades_stage_id_pipeline_stages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_stage_id_pipeline_stages_id_fk FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id) ON DELETE CASCADE;


--
-- Name: permisos permisos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: permisos permisos_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pipeline_stages pipeline_stages_pipeline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: pipeline_stages pipeline_stages_pipeline_id_pipelines_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT pipeline_stages_pipeline_id_pipelines_id_fk FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;


--
-- Name: presupuestos presupuestos_contacto_id_contactos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_contacto_id_contactos_id_fk FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE SET NULL;


--
-- Name: presupuestos presupuestos_contacto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES public.contactos(id) ON DELETE SET NULL;


--
-- Name: presupuestos presupuestos_empresa_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_empresa_id_companies_id_fk FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: presupuestos presupuestos_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: presupuestos presupuestos_oportunidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_oportunidad_id_fkey FOREIGN KEY (oportunidad_id) REFERENCES public.oportunidades(id) ON DELETE SET NULL;


--
-- Name: presupuestos presupuestos_oportunidad_id_oportunidades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_oportunidad_id_oportunidades_id_fk FOREIGN KEY (oportunidad_id) REFERENCES public.oportunidades(id) ON DELETE SET NULL;


--
-- Name: push_subscriptions push_subscriptions_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: report_schedules report_schedules_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: report_schedules report_schedules_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tareas tareas_asignado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_asignado_id_fkey FOREIGN KEY (asignado_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tareas tareas_asignado_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_asignado_id_users_id_fk FOREIGN KEY (asignado_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tareas tareas_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tareas tareas_creado_por_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_creado_por_users_id_fk FOREIGN KEY (creado_por) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: vistas_guardadas vistas_guardadas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas_guardadas
    ADD CONSTRAINT vistas_guardadas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: vistas_guardadas vistas_guardadas_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vistas_guardadas
    ADD CONSTRAINT vistas_guardadas_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: webhook_deliveries webhook_deliveries_endpoint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_endpoint_id_fkey FOREIGN KEY (endpoint_id) REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE;


--
-- Name: webhook_deliveries webhook_deliveries_endpoint_id_webhook_endpoints_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_endpoint_id_webhook_endpoints_id_fk FOREIGN KEY (endpoint_id) REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


`;

// Códigos PG benignos al re-ejecutar sobre una BD ya migrada (el objeto ya existe).
const DUPLICATE_CODES = new Set([
  "42P07", // relation already exists
  "42710", // duplicate object (constraint, trigger, index...)
  "42701", // duplicate column
  "42723", // duplicate function
  "42P16", // primary key already present
]);

// Parte BOOTSTRAP en sentencias. Respeta cuerpos $$...$$ (funciones) y
// descarta comentarios de línea; el resto se ejecuta tal cual.
function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let current = "";
  let inDollar = false;
  for (const line of sql.split("\n")) {
    const trimmed = line.trim();
    if (!inDollar && trimmed.startsWith("--")) continue;
    const markers = (line.match(/\$\$/g) || []).length;
    current += line + "\n";
    if (markers % 2 === 1) inDollar = !inDollar;
    if (!inDollar && trimmed.endsWith(";")) {
      if (current.trim()) out.push(current);
      current = "";
    }
  }
  if (current.trim()) out.push(current);
  return out;
}

async function migrate() {
  const statements = splitStatements(BOOTSTRAP);
  let applied = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      applied++;
    } catch (err: any) {
      if (err?.code && DUPLICATE_CODES.has(err.code)) {
        skipped++;
        continue;
      }
      throw err;
    }
  }
  console.log(`Migrate OK: ${applied} aplicadas, ${skipped} ya existían`);
  await pool.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
