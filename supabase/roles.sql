-- Se ejecuta al arrancar el stack local, ANTES de la API (PostgREST carga su caché de esquemas al
-- arrancar y falla con 503 si `cv-formatter` ⊥ existe, y las migraciones van después de la API).
-- Solo crea el esquema vacío: las tablas y policies las pone tools/local/preparar-stack.mjs.
CREATE SCHEMA IF NOT EXISTS "cv-formatter";
