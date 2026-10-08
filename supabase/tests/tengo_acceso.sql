-- Prueba de acceso por app de cv-formatter, contra el stack EFÍMERO de Docker (⊥ dev, ⊥ prod).
-- Aplica las migraciones del repo DENTRO de la transacción y hace ROLLBACK: ⊥ deja nada.
--
-- Correrla (el stack de guarnote ya tiene `plataforma`):
--   cat supabase/migrations/*.sql supabase/tests/tengo_acceso.sql | \
--     docker exec -i supabase_db_guarnote psql -U postgres -q -v ON_ERROR_STOP=1
-- (el .sql de migración abre su propio contexto: este archivo abre BEGIN al final de ellas, ver abajo)
--
-- Qué tiene que salir (todas las aserciones pasan, o `psql` aborta con la que falló):
--   conAcceso: tengo_acceso() = true · puede escribir el CV
--   sinAcceso: tengo_acceso() = false · INSERT → RLS (42501) · UPDATE/DELETE → 0 filas
--   anon: tengo_acceso() → permission denied (42501) · lee el CV público
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'con@x'),
  ('00000000-0000-0000-0000-0000000000d2', 'sin@x');
INSERT INTO plataforma.app_access (user_id, app)
  VALUES ('00000000-0000-0000-0000-0000000000c1', 'cv-formatter');
INSERT INTO "cv-formatter".profiles (id, nombre) VALUES ('10000000-0000-0000-0000-000000000001', 'CV público');

CREATE FUNCTION public.afirmar_tmp(ok boolean, que text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN IF NOT ok THEN RAISE EXCEPTION 'FALLÓ: %', que; END IF; END $$;
GRANT EXECUTE ON FUNCTION public.afirmar_tmp(boolean, text) TO authenticated, anon;

-- CON acceso
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true) \g /dev/null
SELECT public.afirmar_tmp("cv-formatter".tengo_acceso() IS TRUE, 'conAcceso: tengo_acceso() debía ser true');
UPDATE "cv-formatter".profiles SET nombre = 'editado' WHERE id = '10000000-0000-0000-0000-000000000001';
SELECT public.afirmar_tmp((SELECT nombre FROM "cv-formatter".profiles) = 'editado', 'conAcceso: debía poder escribir');
RESET ROLE;

-- SIN acceso (tiene cuenta, ⊥ tiene cv-formatter)
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true) \g /dev/null
SELECT public.afirmar_tmp("cv-formatter".tengo_acceso() IS FALSE, 'sinAcceso: tengo_acceso() debía ser false');
DO $$ BEGIN
  BEGIN
    INSERT INTO "cv-formatter".profiles (nombre) VALUES ('intruso');
    RAISE EXCEPTION 'FALLÓ: sinAcceso pudo insertar';
  EXCEPTION WHEN insufficient_privilege THEN NULL; -- 42501: RLS
  END;
END $$;
WITH u AS (UPDATE "cv-formatter".profiles SET nombre = 'hack' RETURNING 1)
  SELECT public.afirmar_tmp((SELECT count(*) FROM u) = 0, 'sinAcceso: el UPDATE ⊥ debía tocar filas');
WITH d AS (DELETE FROM "cv-formatter".profiles RETURNING 1)
  SELECT public.afirmar_tmp((SELECT count(*) FROM d) = 0, 'sinAcceso: el DELETE ⊥ debía tocar filas');
RESET ROLE;

-- ANON
SET LOCAL ROLE anon;
SELECT public.afirmar_tmp((SELECT count(*) FROM "cv-formatter".profiles) = 1, 'anon: el CV público debía leerse');
DO $$ BEGIN
  BEGIN
    PERFORM "cv-formatter".tengo_acceso();
    RAISE EXCEPTION 'FALLÓ: anon pudo ejecutar tengo_acceso()';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

\echo OK: acceso por app de cv-formatter
ROLLBACK;
