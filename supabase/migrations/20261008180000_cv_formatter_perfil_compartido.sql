-- ============================================================
-- cv-formatter: el CV es la ÚNICA fuente del perfil; el portfolio lo lee.
--
-- ## Por qué
--
-- `guarnold-portfolio` guardaba su propia copia en `src/data/content.yml` y ya se contradecía con
-- el CV (Tinkin «Actualidad» vs terminó 2025-08, Merovingian solo en un lado, título y ubicación
-- distintos). Ahora el editor de cv-formatter escribe acá y el portfolio lee `portfolio_publico()`.
--
-- ## Qué cambia
--
-- 1. Columnas nuevas (todas NULL o con default ∴ ⊥ rompen las filas ni el editor actual):
--    fechas estructuradas `YYYY-MM`, `en_curso`, `tecnologias`, textos cortos para el portfolio y
--    banderas `en_cv` / `en_portfolio` que deciden DÓNDE aparece cada ítem.
-- 2. `profiles.portfolio jsonb`: lo que es SOLO del portfolio (hero, stack, idiomas, fortalezas,
--    intereses). ⊥ merece tablas: el CV ⊥ lo usa y el editor lo trata como un bloque.
-- 3. `"cv-formatter".portfolio_publico()`: arma el jsonb que consume el portfolio.
--
-- ## Lo que ⊥ cambia (a propósito)
--
-- Las policies. El CV es público (con teléfono y email) ∴ las banderas son EDITORIALES, ⊥ de
-- seguridad: la RPC deja afuera teléfono y email porque el portfolio ⊥ los muestra, ⊥ porque sean
-- secretos. Si algún día un campo debe ser privado de verdad, hay que sacar el «Public Read» de esa
-- tabla — ⊥ alcanza con una bandera.
--
-- `en_portfolio` nace en false: nada aparece en el portfolio hasta que el owner lo marque.
-- ============================================================

-- 1. COLUMNAS ------------------------------------------------

ALTER TABLE "cv-formatter".profiles
  ADD COLUMN IF NOT EXISTS apodo text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS pais text,
  ADD COLUMN IF NOT EXISTS portfolio jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cv-formatter".experiences
  ADD COLUMN IF NOT EXISTS fecha_inicio text,
  ADD COLUMN IF NOT EXISTS fecha_fin text,
  ADD COLUMN IF NOT EXISTS en_curso boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS descripcion_corta text,
  ADD COLUMN IF NOT EXISTS tecnologias text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS en_cv boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS en_portfolio boolean NOT NULL DEFAULT false;

ALTER TABLE "cv-formatter".education
  ADD COLUMN IF NOT EXISTS fecha_inicio text,
  ADD COLUMN IF NOT EXISTS fecha_fin text,
  ADD COLUMN IF NOT EXISTS en_curso boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS descripcion_corta text,
  ADD COLUMN IF NOT EXISTS tecnologias text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS en_cv boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS en_portfolio boolean NOT NULL DEFAULT false;

ALTER TABLE "cv-formatter".projects
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS descripcion_corta text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tamano text,
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS icono text,
  ADD COLUMN IF NOT EXISTS imagen_url text,
  ADD COLUMN IF NOT EXISTS en_cv boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS en_portfolio boolean NOT NULL DEFAULT false;

ALTER TABLE "cv-formatter".social_links
  ADD COLUMN IF NOT EXISTS en_portfolio boolean NOT NULL DEFAULT false;

-- Fechas: `YYYY-MM` o NULL. Un texto libre acá es justo el desvío que esta migración quiere cortar.
DO $$
DECLARE
  t text;
  c text;
BEGIN
  FOREACH t IN ARRAY ARRAY['experiences', 'education'] LOOP
    FOREACH c IN ARRAY ARRAY['fecha_inicio', 'fecha_fin'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = t || '_' || c || '_formato' AND conrelid = format('%I.%I', 'cv-formatter', t)::regclass
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I.%I ADD CONSTRAINT %I CHECK (%I IS NULL OR %I ~ ''^[0-9]{4}-(0[1-9]|1[0-2])$'')',
          'cv-formatter', t, t || '_' || c || '_formato', c, c);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- El `slug` identifica el proyecto entre el CV y el portfolio (ej. 'buckshot-tracker'); único si existe.
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_key
  ON "cv-formatter".projects (slug) WHERE slug IS NOT NULL;

-- 2. RPC -----------------------------------------------------
--
-- SECURITY INVOKER: las policies «Public Read» ya dejan leer todo a `anon` ∴ ⊥ hace falta
-- privilegio propio, y una función DEFINER sería una superficie de más.
-- La forma del jsonb es la de `guarnold-portfolio/src/data/content.yml` (identity, hero, ...,
-- experience, projects) para que el portfolio cambie de origen sin tocar sus componentes.

CREATE OR REPLACE FUNCTION "cv-formatter".portfolio_publico()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH p AS (
    SELECT * FROM "cv-formatter".profiles ORDER BY created_at, id LIMIT 1
  )
  SELECT jsonb_strip_nulls(
    jsonb_build_object(
      'identity', jsonb_build_object(
        'name', p.nombre,
        'nickname', p.apodo,
        'professional_title', p.titulo,
        'avatar_url', p.foto_url
      ),
      'location', jsonb_build_object('city', p.ciudad, 'country', p.pais),
      'social', coalesce((
        SELECT jsonb_object_agg(lower(s.platform), s.url)
        FROM "cv-formatter".social_links s
        WHERE s.profile_id = p.id AND s.en_portfolio AND s.platform IS NOT NULL
      ), '{}'::jsonb),
      'experience', coalesce((
        SELECT jsonb_agg(x.fila ORDER BY x.orden DESC, x.inicio DESC)
        FROM (
          SELECT 1 AS orden, e.fecha_inicio AS inicio, jsonb_build_object(
            'id', 'work-' || e.id,
            'type', 'work',
            'company', e.empresa,
            'role', e.puesto,
            'start_date', e.fecha_inicio,
            'end_date', CASE WHEN e.en_curso THEN NULL ELSE e.fecha_fin END,
            'status', coalesce(e.estado, CASE WHEN e.en_curso THEN 'En curso' END),
            'is_completed', NOT e.en_curso,
            'description', coalesce(e.descripcion_corta, e.descripcion),
            'technologies', to_jsonb(e.tecnologias)
          ) AS fila
          FROM "cv-formatter".experiences e
          WHERE e.profile_id = p.id AND e.en_portfolio
          UNION ALL
          SELECT 0, d.fecha_inicio, jsonb_build_object(
            'id', 'edu-' || d.id,
            'type', 'education',
            'institution', d.institucion,
            'title', d.titulo,
            'start_date', d.fecha_inicio,
            'end_date', CASE WHEN d.en_curso THEN NULL ELSE d.fecha_fin END,
            'status', coalesce(d.estado, CASE WHEN d.en_curso THEN 'En curso' END),
            'is_completed', NOT d.en_curso,
            'description', coalesce(d.descripcion_corta, d.descripcion),
            'technologies', to_jsonb(d.tecnologias)
          )
          FROM "cv-formatter".education d
          WHERE d.profile_id = p.id AND d.en_portfolio
        ) x
      ), '[]'::jsonb),
      'projects', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', coalesce(j.slug, j.id::text),
          'title', j.nombre,
          'description', coalesce(j.descripcion_corta, j.descripcion),
          'link', j.url,
          'github_url', j.github_url,
          'tags', to_jsonb(j.tags),
          'size', j.tamano,
          'status', j.estado,
          'icon', j.icono,
          'image_url', j.imagen_url
        ) ORDER BY j.display_order)
        FROM "cv-formatter".projects j
        WHERE j.profile_id = p.id AND j.en_portfolio
      ), '[]'::jsonb)
    )
    -- hero / about_card / stack / strengths / languages / interests: bloque del portfolio, tal cual.
    || p.portfolio
  )
  FROM p;
$$;

COMMENT ON FUNCTION "cv-formatter".portfolio_publico() IS
  'jsonb público para guarnold-portfolio (forma de content.yml). Sin teléfono ni email. Solo ítems con en_portfolio. Editorial, ⊥ seguridad: el CV ya es público.';

REVOKE ALL ON FUNCTION "cv-formatter".portfolio_publico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "cv-formatter".portfolio_publico() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
