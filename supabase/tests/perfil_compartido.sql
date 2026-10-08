-- Prueba de `portfolio_publico()` contra el stack EFÍMERO de Docker (⊥ dev, ⊥ prod).
-- Aplica las migraciones del repo y hace ROLLBACK: ⊥ deja nada.
--
--   cat supabase/migrations/*.sql supabase/tests/perfil_compartido.sql | \
--     docker exec -i supabase_db_guarnote psql -U postgres -q -v ON_ERROR_STOP=1
--
-- Qué tiene que salir (si algo falla, `psql` aborta con el mensaje de la aserción):
--   · anon la ejecuta · ⊥ aparece teléfono ni email · solo salen ítems con en_portfolio
--   · el orden es trabajo antes que estudio, lo más nuevo primero
--   · en_curso ⇒ end_date ausente y status «En curso» · el slug es el id del proyecto
--   · fecha con formato libre ⇒ el CHECK la rechaza
BEGIN;

CREATE FUNCTION public.afirmar_tmp(ok boolean, que text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN IF NOT ok THEN RAISE EXCEPTION 'FALLÓ: %', que; END IF; END $$;
GRANT EXECUTE ON FUNCTION public.afirmar_tmp(boolean, text) TO anon;

INSERT INTO "cv-formatter".profiles (id, nombre, apodo, titulo, email, telefono, ciudad, pais, portfolio, mostrar, foto_url)
VALUES ('10000000-0000-0000-0000-000000000001', 'Facundo', 'Guarnold', 'Ingeniero', 'x@y.z', '+54 9 261 000',
        'Mendoza', 'Argentina', '{"hero": {"title": "Hola"}, "stack": {"title": "Arsenal"}}',
        '{"portfolio": {"foto": false}}', 'http://foto');

INSERT INTO "cv-formatter".social_links (profile_id, platform, label, url, en_portfolio) VALUES
  ('10000000-0000-0000-0000-000000000001', 'GitHub', 'GitHub', 'https://github.com/x', true),
  ('10000000-0000-0000-0000-000000000001', 'twitter', 'X', 'https://x.com/x', false);

INSERT INTO "cv-formatter".experiences
  (profile_id, puesto, empresa, descripcion, descripcion_corta, fecha_inicio, fecha_fin, en_curso, tecnologias, en_portfolio) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Dev', 'Vieja', 'larga', NULL, '2024-08', '2025-08', false, '{Flutter}', true),
  ('10000000-0000-0000-0000-000000000001', 'Dev', 'Nueva', 'larga', 'corta', '2025-09', NULL, true, '{Supabase}', true),
  ('10000000-0000-0000-0000-000000000001', 'Dev', 'Oculta', 'x', NULL, '2020-01', '2020-02', false, '{}', false);

INSERT INTO "cv-formatter".skills (profile_id, nombre, nivel, categoria, icono, en_cv, en_portfolio, display_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Python', 5, 'Lenguajes', 'code', true, true, 1),
  ('10000000-0000-0000-0000-000000000001', 'React', 4, 'Frameworks', 'layout', true, true, 2),
  ('10000000-0000-0000-0000-000000000001', 'SQL', 4, 'Lenguajes', 'database', true, true, 3),
  ('10000000-0000-0000-0000-000000000001', 'Excel', 3, 'Otros', NULL, true, false, 4);

INSERT INTO "cv-formatter".perfil_items (profile_id, tipo, texto, icono, en_cv, en_portfolio, display_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'idioma', 'Español', NULL, true, true, 1),
  ('10000000-0000-0000-0000-000000000001', 'idioma', 'Inglés', NULL, true, false, 2),
  ('10000000-0000-0000-0000-000000000001', 'fortaleza', 'Prudencia', NULL, false, true, 1),
  ('10000000-0000-0000-0000-000000000001', 'interes', 'Domótica', 'House', false, true, 1);

INSERT INTO "cv-formatter".education (profile_id, institucion, titulo, fecha_inicio, fecha_fin, estado, en_portfolio)
VALUES ('10000000-0000-0000-0000-000000000001', 'UM', 'Ing', '2020-03', '2025-12', 'Graduado', true);

INSERT INTO "cv-formatter".projects (profile_id, nombre, descripcion, slug, tags, url, en_portfolio, display_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'B', 'b', 'b-slug', '{Game}', 'https://b', true, 2),
  ('10000000-0000-0000-0000-000000000001', 'A', 'a', NULL, '{}', NULL, true, 1),
  ('10000000-0000-0000-0000-000000000001', 'Oculto', 'o', NULL, '{}', NULL, false, 0);

SET LOCAL ROLE anon;
CREATE TEMP TABLE r AS SELECT "cv-formatter".portfolio_publico() AS j;
GRANT SELECT ON r TO anon;

SELECT public.afirmar_tmp(j::text NOT LIKE '%x@y.z%' AND j::text NOT LIKE '%261 000%', 'filtró teléfono o email') FROM r;
SELECT public.afirmar_tmp(j #>> '{identity,name}' = 'Facundo' AND j #>> '{identity,nickname}' = 'Guarnold', 'identity') FROM r;
SELECT public.afirmar_tmp(j #>> '{location,city}' = 'Mendoza', 'location') FROM r;
SELECT public.afirmar_tmp(j #>> '{hero,title}' = 'Hola', 'el bloque portfolio ⊥ se mezcló') FROM r;
SELECT public.afirmar_tmp(j #>> '{social,github}' = 'https://github.com/x' AND j #> '{social,twitter}' IS NULL, 'social: solo en_portfolio, clave en minúscula') FROM r;
SELECT public.afirmar_tmp(jsonb_array_length(j -> 'experience') = 3, 'experience: 2 trabajos + 1 estudio visibles') FROM r;
SELECT public.afirmar_tmp(j #>> '{experience,0,company}' = 'Nueva' AND j #>> '{experience,1,company}' = 'Vieja' AND j #>> '{experience,2,type}' = 'education', 'orden: trabajo antes que estudio, nuevo primero') FROM r;
SELECT public.afirmar_tmp(j #> '{experience,0,end_date}' IS NULL AND j #>> '{experience,0,status}' = 'En curso' AND (j #> '{experience,0,is_completed}') = 'false', 'en_curso') FROM r;
SELECT public.afirmar_tmp(j #>> '{experience,0,description}' = 'corta' AND j #>> '{experience,1,description}' = 'larga', 'descripcion_corta con fallback a descripcion') FROM r;
SELECT public.afirmar_tmp(j #>> '{experience,1,end_date}' = '2025-08' AND (j #> '{experience,1,is_completed}') = 'true', 'terminado') FROM r;
SELECT public.afirmar_tmp(j #>> '{experience,2,status}' = 'Graduado', 'estado explícito') FROM r;
SELECT public.afirmar_tmp(jsonb_array_length(j -> 'projects') = 2 AND j #>> '{projects,0,title}' = 'A' AND j #>> '{projects,1,id}' = 'b-slug', 'projects: orden, slug como id, oculto fuera') FROM r;
SELECT public.afirmar_tmp(jsonb_array_length(j #> '{stack,groups}') = 2 AND j #>> '{stack,groups,0,category}' = 'Lenguajes' AND jsonb_array_length(j #> '{stack,groups,0,technologies}') = 2 AND j::text NOT LIKE '%Excel%', 'stack: sale de skills por categoría, solo en_portfolio') FROM r;
SELECT public.afirmar_tmp(j #>> '{stack,title}' = 'Arsenal', 'stack: el título de sección se fusiona con groups') FROM r;
SELECT public.afirmar_tmp(j #> '{languages,items}' = '["Español"]'::jsonb AND j #> '{strengths,items}' = '["Prudencia"]'::jsonb, 'perfil_items: idioma y fortaleza, solo en_portfolio') FROM r;
SELECT public.afirmar_tmp(j #>> '{interests,items,0,name}' = 'Domótica' AND j #>> '{interests,items,0,icon}' = 'House', 'perfil_items: interés con ícono') FROM r;
SELECT public.afirmar_tmp(j #> '{identity,avatar_url}' IS NULL AND j #> '{identity,email}' IS NULL AND j #> '{identity,phone}' IS NULL, 'mostrar: foto oculta, email y teléfono ausentes') FROM r;
RESET ROLE;

-- mostrar.portfolio habilita email, teléfono y foto
UPDATE "cv-formatter".profiles SET mostrar = '{"portfolio": {"email": true, "telefono": true, "foto": true}}';
SET LOCAL ROLE anon;
SELECT public.afirmar_tmp(
  ("cv-formatter".portfolio_publico() #>> '{identity,email}') = 'x@y.z'
  AND ("cv-formatter".portfolio_publico() #>> '{identity,phone}') = '+54 9 261 000'
  AND ("cv-formatter".portfolio_publico() #>> '{identity,avatar_url}') = 'http://foto',
  'mostrar: email, teléfono y foto habilitados');
RESET ROLE;

DO $$ BEGIN
  BEGIN
    UPDATE "cv-formatter".experiences SET fecha_inicio = 'Agosto 2024';
    RAISE EXCEPTION 'FALLÓ: el CHECK de fecha aceptó texto libre';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;

\echo OK: perfil compartido de cv-formatter
ROLLBACK;
