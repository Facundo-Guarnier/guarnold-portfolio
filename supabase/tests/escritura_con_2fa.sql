-- Escribir el CV exige acceso a cv-formatter Y sesión con 2FA (aal2). Migración cv_formatter_escritura_con_2fa.
-- `npm run test:sql` lo corre en su transacción con ROLLBACK: ⊥ deja nada.
--
-- Qué tiene que salir:
--   con acceso + aal2: estado_editor() = 'si' · escribe
--   con acceso + aal1: estado_editor() = 'sin_2fa' · INSERT → RLS (42501) · UPDATE/DELETE → 0 filas
--   sin acceso + aal2: estado_editor() = 'sin_acceso'
--   anon: ⊥ INSERT/UPDATE/DELETE/TRUNCATE por privilegio (42501), ⊥ estado_editor() · lee el CV
--   authenticated: ⊥ TRUNCATE (RLS ⊥ lo cubre: lo frena el privilegio)
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'con@x'),
  ('00000000-0000-0000-0000-0000000000d2', 'sin@x');
INSERT INTO plataforma.app_access (user_id, app)
  VALUES ('00000000-0000-0000-0000-0000000000c1', 'cv-formatter');
INSERT INTO "cv-formatter".profiles (id, nombre) VALUES ('10000000-0000-0000-0000-000000000001', 'CV público');

CREATE FUNCTION public.afirmar_tmp(ok boolean, que text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN IF NOT ok THEN RAISE EXCEPTION 'FALLÓ: %', que; END IF; END $$;
GRANT EXECUTE ON FUNCTION public.afirmar_tmp(boolean, text) TO authenticated, anon;

-- CON acceso + aal2
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal2"}', true) \g /dev/null
SELECT public.afirmar_tmp("cv-formatter".estado_editor() = 'si', 'aal2: estado_editor() debía ser si');
UPDATE "cv-formatter".profiles SET nombre = 'editado' WHERE id = '10000000-0000-0000-0000-000000000001';
SELECT public.afirmar_tmp((SELECT nombre FROM "cv-formatter".profiles) = 'editado', 'aal2: debía poder escribir');
INSERT INTO "cv-formatter".perfil_items (profile_id, tipo, texto)
  VALUES ('10000000-0000-0000-0000-000000000001', 'idioma', 'Inglés');
RESET ROLE;

-- CON acceso + aal1 (solo contraseña)
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated","aal":"aal1"}', true) \g /dev/null
SELECT public.afirmar_tmp("cv-formatter".estado_editor() = 'sin_2fa', 'aal1: estado_editor() debía ser sin_2fa');
DO $$ BEGIN
  BEGIN
    INSERT INTO "cv-formatter".experiences (profile_id, empresa) VALUES ('10000000-0000-0000-0000-000000000001', 'intruso');
    RAISE EXCEPTION 'FALLÓ: aal1 pudo insertar';
  EXCEPTION WHEN insufficient_privilege THEN NULL; -- 42501: RLS
  END;
END $$;
WITH u AS (UPDATE "cv-formatter".profiles SET nombre = 'hack' RETURNING 1)
  SELECT public.afirmar_tmp((SELECT count(*) FROM u) = 0, 'aal1: el UPDATE ⊥ debía tocar filas');
WITH d AS (DELETE FROM "cv-formatter".perfil_items RETURNING 1)
  SELECT public.afirmar_tmp((SELECT count(*) FROM d) = 0, 'aal1: el DELETE ⊥ debía tocar filas');
-- Sin claim `aal` (token viejo o raro) = aal1.
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true) \g /dev/null
SELECT public.afirmar_tmp("cv-formatter".estado_editor() = 'sin_2fa', 'sin aal: estado_editor() debía ser sin_2fa');
WITH u AS (UPDATE "cv-formatter".profiles SET nombre = 'hack' RETURNING 1)
  SELECT public.afirmar_tmp((SELECT count(*) FROM u) = 0, 'sin aal: el UPDATE ⊥ debía tocar filas');
DO $$ BEGIN
  BEGIN
    TRUNCATE "cv-formatter".perfil_items;
    RAISE EXCEPTION 'FALLÓ: authenticated pudo hacer TRUNCATE';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

-- SIN acceso + aal2
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated","aal":"aal2"}', true) \g /dev/null
SELECT public.afirmar_tmp("cv-formatter".estado_editor() = 'sin_acceso', 'sin acceso: estado_editor() debía ser sin_acceso');
WITH u AS (UPDATE "cv-formatter".profiles SET nombre = 'hack' RETURNING 1)
  SELECT public.afirmar_tmp((SELECT count(*) FROM u) = 0, 'sin acceso: el UPDATE ⊥ debía tocar filas');
RESET ROLE;

-- ANON
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true) \g /dev/null
SELECT public.afirmar_tmp((SELECT nombre FROM "cv-formatter".profiles) = 'editado', 'anon: el CV público debía leerse');
DO $$
DECLARE s TEXT;
BEGIN
  FOREACH s IN ARRAY ARRAY[
    'INSERT INTO "cv-formatter".perfil_items (profile_id, tipo, texto) VALUES (''10000000-0000-0000-0000-000000000001'', ''idioma'', ''x'')',
    'UPDATE "cv-formatter".profiles SET nombre = ''hack''',
    'DELETE FROM "cv-formatter".perfil_items',
    'TRUNCATE "cv-formatter".perfil_items',
    'SELECT "cv-formatter".estado_editor()'
  ] LOOP
    BEGIN
      EXECUTE s;
      RAISE EXCEPTION 'FALLÓ: anon pudo: %', s;
    EXCEPTION WHEN insufficient_privilege THEN NULL; -- privilegio, ⊥ RLS
    END;
  END LOOP;
END $$;
RESET ROLE;

\echo OK: escritura del CV con acceso + 2FA
ROLLBACK;
