-- ============================================================
-- "cv-formatter".tengo_acceso(): ¿la cuenta con sesión puede editar el CV?
--
-- REQUIERE: `plataforma_acceso_por_app` (repo de GuarNote) + `cv_formatter_acceso_por_app`.
-- Modelo: guarnold-hub/docs/acceso-por-app.md. Mismo patrón que `pivot.tengo_acceso()`.
--
-- ## Por qué
--
-- La cuenta es UNA para todas las apps: una cuenta SIN `cv-formatter` en `plataforma.app_access`
-- puede loguearse igual. Las policies le niegan toda escritura, pero el editor ⊥ se enteraba:
-- mostraba el CV y fallaba al guardar. Esto permite mostrar «tu cuenta ⊥ tiene acceso».
--
-- `plataforma` ⊥ está expuesto en la API a propósito ∴ cada app expone su propia pregunta, en su
-- esquema (ya expuesto).
--
-- ## Decisiones
--
-- - SECURITY INVOKER: ⊥ necesita privilegios propios (`authenticated` ya puede ejecutar la
--   SECURITY DEFINER `plataforma.has_app_access()`).
-- - Es UX, ⊥ seguridad: lo que protege las escrituras son las policies.
-- - `anon` ⊥ la ejecuta: el CV público ⊥ pregunta nada, y sin sesión la pregunta ⊥ tiene sentido.
-- ============================================================

CREATE OR REPLACE FUNCTION "cv-formatter".tengo_acceso()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT plataforma.has_app_access('cv-formatter');
$$;

COMMENT ON FUNCTION "cv-formatter".tengo_acceso() IS
  'true si auth.uid() tiene acceso vigente a cv-formatter (plataforma.app_access). UX: las policies son la regla real.';

REVOKE ALL ON FUNCTION "cv-formatter".tengo_acceso() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION "cv-formatter".tengo_acceso() TO authenticated;

NOTIFY pgrst, 'reload schema';
