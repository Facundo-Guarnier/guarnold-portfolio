-- ============================================================
-- MIGRACIÓN: cv-formatter schema
-- Descripción: Crea el esquema cv-formatter para el proyecto Guarnold Main
--              con todas las tablas, constraints, RLS y policies
-- Origen: ophubxyvhzfodsmmomeq (cv-formatter)
-- Destino: brzuaxeuqqqipkaennre (Guarnold Main)
-- Fecha: 2026-01-14
-- ============================================================

-- 1. CREAR SCHEMA
CREATE SCHEMA IF NOT EXISTS "cv-formatter";

-- 2. CREAR TABLAS (tabla principal primero)

-- profiles (tabla principal)
CREATE TABLE "cv-formatter".profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    nombre text,
    titulo text,
    email text,
    telefono text,
    ubicacion text,
    resumen text,
    foto_url text,
    settings jsonb DEFAULT '{"darkMode": false, "themeColor": "neutral"}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- social_links
CREATE TABLE "cv-formatter".social_links (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    profile_id uuid,
    platform text,
    label text,
    url text,
    display_order integer DEFAULT 0,
    CONSTRAINT social_links_pkey PRIMARY KEY (id)
);

-- experiences
CREATE TABLE "cv-formatter".experiences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    profile_id uuid,
    puesto text,
    empresa text,
    periodo text,
    descripcion text,
    display_order integer DEFAULT 0,
    CONSTRAINT experiences_pkey PRIMARY KEY (id)
);

-- education
CREATE TABLE "cv-formatter".education (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    profile_id uuid,
    institucion text,
    titulo text,
    periodo text,
    descripcion text,
    display_order integer DEFAULT 0,
    CONSTRAINT education_pkey PRIMARY KEY (id)
);

-- skills (con CHECK constraint)
CREATE TABLE "cv-formatter".skills (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    profile_id uuid,
    nombre text,
    nivel integer,
    display_order integer DEFAULT 0,
    CONSTRAINT skills_pkey PRIMARY KEY (id),
    CONSTRAINT skills_nivel_check CHECK (nivel >= 0 AND nivel <= 5)
);

-- projects
CREATE TABLE "cv-formatter".projects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    profile_id uuid,
    nombre text,
    descripcion text,
    tecnologias text,
    url text,
    display_order integer DEFAULT 0,
    CONSTRAINT projects_pkey PRIMARY KEY (id)
);

-- 3. AGREGAR FOREIGN KEYS
ALTER TABLE "cv-formatter".social_links 
    ADD CONSTRAINT social_links_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES "cv-formatter".profiles(id);

ALTER TABLE "cv-formatter".experiences 
    ADD CONSTRAINT experiences_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES "cv-formatter".profiles(id);

ALTER TABLE "cv-formatter".education 
    ADD CONSTRAINT education_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES "cv-formatter".profiles(id);

ALTER TABLE "cv-formatter".skills 
    ADD CONSTRAINT skills_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES "cv-formatter".profiles(id);

ALTER TABLE "cv-formatter".projects 
    ADD CONSTRAINT projects_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES "cv-formatter".profiles(id);

-- 4. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE "cv-formatter".profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv-formatter".social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv-formatter".experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv-formatter".education ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv-formatter".skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv-formatter".projects ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICAS RLS

-- Profiles
CREATE POLICY "Admin Manage Profiles" ON "cv-formatter".profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Profiles" ON "cv-formatter".profiles
    FOR SELECT USING (true);

-- Social Links
CREATE POLICY "Admin Manage Links" ON "cv-formatter".social_links
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Links" ON "cv-formatter".social_links
    FOR SELECT USING (true);

-- Experiences
CREATE POLICY "Admin Manage Experiences" ON "cv-formatter".experiences
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Experiences" ON "cv-formatter".experiences
    FOR SELECT USING (true);

-- Education
CREATE POLICY "Admin Manage Education" ON "cv-formatter".education
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Education" ON "cv-formatter".education
    FOR SELECT USING (true);

-- Skills
CREATE POLICY "Admin Manage Skills" ON "cv-formatter".skills
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Skills" ON "cv-formatter".skills
    FOR SELECT USING (true);

-- Projects
CREATE POLICY "Admin Manage Projects" ON "cv-formatter".projects
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Projects" ON "cv-formatter".projects
    FOR SELECT USING (true);

-- 6. GRANTS (acceso via API)
GRANT USAGE ON SCHEMA "cv-formatter" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "cv-formatter" TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA "cv-formatter" TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "cv-formatter" TO anon, authenticated, service_role;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
