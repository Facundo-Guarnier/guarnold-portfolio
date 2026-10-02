-- supabase/migrations-draft/cv_formatter_acceso_por_app.sql
-- ============================================================
-- 🔴 cv-formatter: escribir el CV exige ACCESO a cv-formatter, ⊥ solo tener cuenta.
--
-- REQUIERE: `plataforma_acceso_por_app` aplicada antes (vive en el repo de GuarNote). Crea
-- plataforma.app_access + plataforma.has_app_access(), y backfillea `cv-formatter` para toda
-- cuenta previa (hoy: solo el owner).
-- Modelo: guarnold-hub/docs/acceso-por-app.md.
--
-- ## El agujero
--
-- `20260114_create_cv_formatter_schema.sql` dejo en las 6 tablas:
--     FOR ALL USING (auth.role() = 'authenticated')
-- El proyecto Supabase es COMPARTIDO (guarnote, pivot, ...) con UN solo auth.users ∴ CUALQUIER cuenta
-- de CUALQUIER app podia editar o borrar el CV publico. Con las cuentas de prueba de pivot (contraseña
-- publicada en su login) eso es: cualquiera que lea la contraseña reescribe el CV.
--
-- ## Que cambia
--
-- "Admin Manage X" pasa a `TO authenticated` + `plataforma.has_app_access('cv-formatter')` en USING
-- y WITH CHECK. "Public Read X" (SELECT para todos) ⊥ se toca: el CV es publico a proposito.
--
-- ## Post-check contra la BASE
--
-- Si queda cualquier policy de escritura en el esquema sin has_app_access, la migracion FALLA.
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
    ('projects', 'Admin Manage Projects')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol, 'cv-formatter', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR ALL TO authenticated '
      'USING (plataforma.has_app_access(''cv-formatter'')) '
      'WITH CHECK (plataforma.has_app_access(''cv-formatter''))',
      pol, 'cv-formatter', t);
  END LOOP;
END $$;

DO $$
DECLARE
  v_sueltas TEXT;
BEGIN
  SELECT string_agg(tablename || '.' || policyname, ', ') INTO v_sueltas
  FROM pg_policies
  WHERE schemaname = 'cv-formatter'
    AND cmd <> 'SELECT'
    AND coalesce(qual, '') || coalesce(with_check, '') NOT LIKE '%has_app_access%';
  IF v_sueltas IS NOT NULL THEN
    RAISE EXCEPTION 'Quedan policies de escritura en cv-formatter sin has_app_access: %', v_sueltas;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
