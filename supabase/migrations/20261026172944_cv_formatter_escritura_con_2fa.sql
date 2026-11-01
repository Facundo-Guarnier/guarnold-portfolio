-- supabase/migrations/20261026172944_cv_formatter_escritura_con_2fa.sql (guarnote promovió 20261026172943 el mismo segundo: la tabla de versiones es compartida)
-- ============================================================
-- 🔴 cv-formatter: escribir el CV exige acceso a la app Y sesión con 2FA (aal2).
--
-- Auditoría de seguridad 2026-10-25, hallazgo H4. Prioridad del owner: ESCRIBIR es lo grave.
--
-- ## El hueco
--
-- Las 7 policies "Admin Manage X" pedían solo `plataforma.has_app_access('cv-formatter')`: con la
-- contraseña sola (aal1) se reescribía el CV público entero. Y `20260115000436` dejó
-- `GRANT ALL ... TO anon, authenticated`: anon tenía INSERT/UPDATE/DELETE (frenados solo por RLS) y
-- los dos roles tenían TRUNCATE, REFERENCES y TRIGGER, que RLS ⊥ cubre.
--
-- ## Qué cambia
--
-- 1. "Admin Manage X" = has_app_access + `aal = 'aal2'`. Estricto: una cuenta SIN factor TOTP
--    ⊥ escribe (a diferencia de guarnote, donde sin factor alcanza la contraseña). `aal` sale de
--    `auth.jwt()`, que firma Supabase: el cliente ⊥ lo inventa.
-- 2. anon queda en SELECT (el CV es público a propósito); authenticated en SELECT/INSERT/UPDATE/DELETE.
-- 3. `estado_editor()`: UX del editor ('si' | 'sin_acceso' | 'sin_2fa'). Las policies son la regla.
--
-- ## Post-check contra la BASE
--
-- Falla si queda una policy de escritura sin has_app_access o sin aal2, o un privilegio de más.
-- ============================================================

DO $$
DECLARE
  t TEXT;
  pol TEXT;
BEGIN
  FOR t, pol IN VALUES
    ('profiles', 'Admin Manage Profiles'),
    ('social_links', 'Admin Manage Links'),
    ('experiences', 'Admin Manage Experiences'),
    ('education', 'Admin Manage Education'),
    ('skills', 'Admin Manage Skills'),
    ('projects', 'Admin Manage Projects'),
    ('perfil_items', 'Admin Manage PerfilItems')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol, 'cv-formatter', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR ALL TO authenticated '
      'USING (plataforma.has_app_access(''cv-formatter'') AND (SELECT auth.jwt() ->> ''aal'') = ''aal2'') '
      'WITH CHECK (plataforma.has_app_access(''cv-formatter'') AND (SELECT auth.jwt() ->> ''aal'') = ''aal2'')',
      pol, 'cv-formatter', t);
    EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC, anon, authenticated', 'cv-formatter', t);
    EXECUTE format('GRANT SELECT ON %I.%I TO anon', 'cv-formatter', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.%I TO authenticated', 'cv-formatter', t);
  END LOOP;
END $$;

-- Secuencias: hoy ninguna (ids uuid); si aparece una, anon ⊥ la avanza.
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "cv-formatter" FROM anon;

CREATE OR REPLACE FUNCTION "cv-formatter".estado_editor()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN NOT plataforma.has_app_access('cv-formatter') THEN 'sin_acceso'
    WHEN coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN 'sin_2fa'
    ELSE 'si'
  END;
$$;

COMMENT ON FUNCTION "cv-formatter".estado_editor() IS
  'UX del editor: si | sin_acceso | sin_2fa. Mismo criterio que las policies "Admin Manage X" (que son la regla).';

REVOKE ALL ON FUNCTION "cv-formatter".estado_editor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION "cv-formatter".estado_editor() TO authenticated;

DO $$
DECLARE
  v TEXT;
BEGIN
  SELECT string_agg(tablename || '.' || policyname, ', ') INTO v
  FROM pg_policies
  WHERE schemaname = 'cv-formatter'
    AND cmd <> 'SELECT'
    AND (coalesce(qual, '') NOT LIKE '%has_app_access%' OR coalesce(qual, '') NOT LIKE '%aal2%'
      OR coalesce(with_check, '') NOT LIKE '%has_app_access%' OR coalesce(with_check, '') NOT LIKE '%aal2%');
  IF v IS NOT NULL THEN
    RAISE EXCEPTION 'Policies de escritura en cv-formatter sin has_app_access + aal2: %', v;
  END IF;

  SELECT string_agg(DISTINCT c.relname || ' (' || r.rol || ' ' || p.priv || ')', ', ') INTO v
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'cv-formatter'
  CROSS JOIN (VALUES ('anon'), ('authenticated')) r(rol)
  CROSS JOIN (VALUES ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) p(priv)
  WHERE c.relkind IN ('r', 'p')
    AND has_table_privilege(r.rol, c.oid, p.priv)
    AND (r.rol = 'anon' OR p.priv IN ('TRUNCATE', 'REFERENCES', 'TRIGGER'));
  IF v IS NOT NULL THEN
    RAISE EXCEPTION 'Privilegios de más en cv-formatter: %', v;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
