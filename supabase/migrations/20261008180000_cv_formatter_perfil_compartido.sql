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
-- 2. `profiles.portfolio jsonb`: los TEXTOS propios del portfolio (hero, about_card, títulos de
--    sección). El editor los muestra en un formulario ⊥ en JSON crudo.
-- 3. `profiles.mostrar jsonb`: qué datos del perfil se ven en cada lado (teléfono, email, foto...).
-- 4. `perfil_items`: idiomas, fortalezas e intereses. Una tabla, ⊥ tres: los dos lados pueden
--    mostrarlos o no. `skills` gana categoría e ícono: el «stack» del portfolio sale de ahí.
-- 5. `"cv-formatter".portfolio_publico()`: arma el jsonb que consume el portfolio.
--
-- ## Lo que ⊥ cambia (a propósito)
--
-- Las policies. El CV es público (con teléfono y email) ∴ las banderas son EDITORIALES, ⊥ de
-- seguridad: la RPC deja afuera teléfono y email porque el portfolio ⊥ los muestra, ⊥ porque sean
-- secretos. Si algún día un campo debe ser privado de verdad, hay que sacar el «Public Read» de esa
-- tabla — ⊥ alcanza con una bandera.
--
-- `en_portfolio` nace en false: nada aparece en el portfolio hasta que el owner lo marque.
-- `en_cv` nace en true en lo que el CV ya mostraba, y en false en `perfil_items` (nuevo para el CV).
-- ============================================================

-- 1. COLUMNAS ------------------------------------------------

ALTER TABLE "cv-formatter".profiles
  ADD COLUMN IF NOT EXISTS apodo text,
  ADD COLUMN IF NOT EXISTS ciudad text,
  ADD COLUMN IF NOT EXISTS pais text,
  ADD COLUMN IF NOT EXISTS portfolio jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS mostrar jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN "cv-formatter".profiles.mostrar IS
  'Visibilidad de datos del perfil por lado: {"cv": {"email": true, ...}, "portfolio": {"foto": true, ...}}. Claves: email, telefono, foto, ubicacion. Ausente = default (CV: se muestra; portfolio: foto y ubicacion sí, email y telefono no).';
COMMENT ON COLUMN "cv-formatter".profiles.portfolio IS
  'Textos propios del portfolio: hero{title,subtitle,description}, about_card{title,role,description}, stack{title,description}, strengths{title}, languages{title}, interests{title}.';

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
  ADD COLUMN IF NOT EXISTS en_cv boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS en_portfolio boolean NOT NULL DEFAULT false;

-- Skills: el CV las muestra con nivel; el portfolio las agrupa por categoría (su «stack»).
ALTER TABLE "cv-formatter".skills
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS icono text,
  ADD COLUMN IF NOT EXISTS en_cv boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS en_portfolio boolean NOT NULL DEFAULT false;

-- Idiomas, fortalezas e intereses.
CREATE TABLE IF NOT EXISTS "cv-formatter".perfil_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES "cv-formatter".profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  texto text NOT NULL,
  icono text,
  display_order integer NOT NULL DEFAULT 0,
  en_cv boolean NOT NULL DEFAULT false,
  en_portfolio boolean NOT NULL DEFAULT false,
  CONSTRAINT perfil_items_pkey PRIMARY KEY (id),
  CONSTRAINT perfil_items_tipo_check CHECK (tipo IN ('idioma', 'fortaleza', 'interes'))
);

ALTER TABLE "cv-formatter".perfil_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read PerfilItems" ON "cv-formatter".perfil_items;
CREATE POLICY "Public Read PerfilItems" ON "cv-formatter".perfil_items
  FOR SELECT USING (true);

-- Escritura = acceso a la app, igual que las otras 6 (ver 20261002235100). ⊥ auth.role().
DROP POLICY IF EXISTS "Admin Manage PerfilItems" ON "cv-formatter".perfil_items;
CREATE POLICY "Admin Manage PerfilItems" ON "cv-formatter".perfil_items
  FOR ALL TO authenticated
  USING (plataforma.has_app_access('cv-formatter'))
  WITH CHECK (plataforma.has_app_access('cv-formatter'));

REVOKE ALL ON "cv-formatter".perfil_items FROM PUBLIC, anon, authenticated;
GRANT SELECT ON "cv-formatter".perfil_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "cv-formatter".perfil_items TO authenticated;

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
--
-- Visibilidad de datos del perfil: `mostrar->'portfolio'->>clave`; ausente ⇒ default
-- (foto y ubicación sí; email y teléfono no).

CREATE OR REPLACE FUNCTION "cv-formatter".portfolio_publico()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH p AS (
    SELECT
      pr.*,
      coalesce((pr.mostrar -> 'portfolio' ->> 'foto')::boolean, true)      AS ver_foto,
      coalesce((pr.mostrar -> 'portfolio' ->> 'ubicacion')::boolean, true) AS ver_ubicacion,
      coalesce((pr.mostrar -> 'portfolio' ->> 'email')::boolean, false)    AS ver_email,
      coalesce((pr.mostrar -> 'portfolio' ->> 'telefono')::boolean, false) AS ver_telefono
    FROM "cv-formatter".profiles pr
    ORDER BY pr.created_at, pr.id
    LIMIT 1
  ),
  -- Una lista por tipo de perfil_items; los títulos de sección vienen de `portfolio`.
  items AS (
    SELECT i.tipo,
           jsonb_agg(CASE WHEN i.tipo = 'interes'
                          THEN jsonb_build_object('name', i.texto, 'icon', i.icono)
                          ELSE to_jsonb(i.texto) END
                     ORDER BY i.display_order) AS lista
    FROM "cv-formatter".perfil_items i
    JOIN p ON p.id = i.profile_id
    WHERE i.en_portfolio
    GROUP BY i.tipo
  ),
  grupos AS (
    SELECT jsonb_agg(jsonb_build_object('category', g.categoria, 'technologies', g.tecnologias) ORDER BY g.orden) AS lista
    FROM (
      SELECT coalesce(s.categoria, 'Otros') AS categoria,
             min(s.display_order) AS orden,
             jsonb_agg(jsonb_build_object('name', s.nombre, 'icon', s.icono) ORDER BY s.display_order) AS tecnologias
      FROM "cv-formatter".skills s
      JOIN p ON p.id = s.profile_id
      WHERE s.en_portfolio
      GROUP BY coalesce(s.categoria, 'Otros')
    ) g
  )
  SELECT jsonb_strip_nulls(
    jsonb_build_object(
      'identity', jsonb_build_object(
        'name', p.nombre,
        'nickname', p.apodo,
        'professional_title', p.titulo,
        'avatar_url', CASE WHEN p.ver_foto THEN p.foto_url END,
        'email', CASE WHEN p.ver_email THEN p.email END,
        'phone', CASE WHEN p.ver_telefono THEN p.telefono END
      ),
      'location', CASE WHEN p.ver_ubicacion THEN jsonb_build_object(
        'city', coalesce(p.ciudad, p.ubicacion),
        'country', p.pais
      ) END,
      'social', coalesce((
        SELECT jsonb_object_agg(lower(s.platform), s.url)
        FROM "cv-formatter".social_links s
        WHERE s.profile_id = p.id AND s.en_portfolio AND s.platform IS NOT NULL
      ), '{}'::jsonb),
      'stack', coalesce(p.portfolio -> 'stack', '{}'::jsonb)
               || jsonb_build_object('groups', coalesce((SELECT lista FROM grupos), '[]'::jsonb)),
      'strengths', coalesce(p.portfolio -> 'strengths', '{}'::jsonb)
               || jsonb_build_object('items', coalesce((SELECT lista FROM items WHERE tipo = 'fortaleza'), '[]'::jsonb)),
      'languages', coalesce(p.portfolio -> 'languages', '{}'::jsonb)
               || jsonb_build_object('items', coalesce((SELECT lista FROM items WHERE tipo = 'idioma'), '[]'::jsonb)),
      'interests', coalesce(p.portfolio -> 'interests', '{}'::jsonb)
               || jsonb_build_object('items', coalesce((SELECT lista FROM items WHERE tipo = 'interes'), '[]'::jsonb)),
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
    -- hero y about_card: textos del portfolio, tal cual (los títulos de sección ya se fusionaron arriba).
    || (p.portfolio - 'stack' - 'strengths' - 'languages' - 'interests')
  )
  FROM p;
$$;

COMMENT ON FUNCTION "cv-formatter".portfolio_publico() IS
  'jsonb público para guarnold-portfolio (forma de content.yml). Respeta profiles.mostrar y las banderas en_portfolio. Editorial, ⊥ seguridad: el CV ya es público.';

REVOKE ALL ON FUNCTION "cv-formatter".portfolio_publico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "cv-formatter".portfolio_publico() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
