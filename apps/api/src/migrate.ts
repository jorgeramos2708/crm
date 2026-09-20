import pg from 'pg'

const pool = new pg.Pool({
  connectionString: 'postgres://crm:crm_dev_password@postgres:5432/crm',
})

async function migrate() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      activo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS pipelines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(100) NOT NULL,
      descripcion TEXT,
      activo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
      nombre VARCHAR(50) NOT NULL,
      color VARCHAR(7) DEFAULT '#3b82f6',
      orden INTEGER NOT NULL DEFAULT 0,
      es_inicial BOOLEAN NOT NULL DEFAULT false,
      es_final BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS oportunidades (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(200) NOT NULL,
      descripcion TEXT,
      pipeline_id UUID NOT NULL REFERENCES pipelines(id),
      stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
      contacto_id UUID,
      propietario_id UUID,
      importe INTEGER DEFAULT 0,
      probabilidad INTEGER DEFAULT 50,
      fecha_cierre_estimada TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS contactos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      telefono VARCHAR(50),
      empresa VARCHAR(100),
      cargo VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS automatizaciones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(100) NOT NULL,
      descripcion TEXT,
      evento VARCHAR(50) NOT NULL,
      condiciones JSONB NOT NULL DEFAULT '[]',
      acciones JSONB NOT NULL DEFAULT '[]',
      activo BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS email_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(100) NOT NULL,
      asunto VARCHAR(200) NOT NULL,
      contenido_html TEXT NOT NULL,
      contenido_texto TEXT,
      variables JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(100) NOT NULL,
      template_id UUID REFERENCES email_templates(id),
      remitente_nombre VARCHAR(100) NOT NULL,
      remitente_email VARCHAR(255) NOT NULL,
      asunto VARCHAR(200) NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'borrador',
      programada_para TIMESTAMPTZ,
      enviada_en TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tipo VARCHAR(30) NOT NULL,
      titulo VARCHAR(200) NOT NULL,
      descripcion TEXT,
      entity_type VARCHAR(30) NOT NULL,
      entity_id UUID NOT NULL,
      user_id UUID,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  `)
  console.log('Tables created successfully')
  process.exit(0)
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})