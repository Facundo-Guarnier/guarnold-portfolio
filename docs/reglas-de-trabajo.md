# Reglas de trabajo (git, ramas, PR, "listo", preguntas)

Fuente única de las reglas transversales de este repo. `AGENTS.md` las enlaza y el hub
(`guarnold-hub/METODOLOGIA.md`) las enlaza también: si cambia una, se cambia acá.

## 1. Ramas

| Rama | Para qué | Regla |
|---|---|---|
| `main` | Producción. Netlify y el host despliegan esta rama | Protegida. Entra **solo por PR desde `dev`**. Sin force-push ni borrado |
| `dev` | Trabajo diario. Rama por defecto | El agente commitea acá. Los checks de CI corren también en `dev` |
| `feat/…`, `fix/…`, `chore/…` | Cambios que no caben en un commit verificado, o que tocan varios módulos | PR a `dev` |
| `backup/<motivo>` | Foto antes de algo irreversible | Local. No se pushea. Se borra cuando lo respaldado se confirmó |
| `dependabot/**` | La crea GitHub | La cierra el merge. Si el PR se cierra sin mergear, se borra a mano |

- Crear una rama nueva: verificar la rama por defecto con `git symbolic-ref --short HEAD`
  (`git init` puede crear `master`).
- Antes de renombrar o borrar una rama: `git rev-list --count A..B` para confirmar que no se pierden commits.
- En repos de cliente, una rama remota borrada no se recupera: borrar solo lo propio.

### Por qué `dev` tiene CI

Si la convención dice "se trabaja en `dev`" y el CI solo corre en `push` a `main`, lo que se
commitea a `dev` no lo mira nadie hasta el PR, que es cuando ya es tarde. La protección de `main`
tiene que estar donde ocurre el trabajo: el CI corre en `push` y `pull_request` de `main` **y** `dev`.

## 2. Commits

- Los hace el agente cuando la tarea está completa **y verificada**.
- **Staging explícito**: `git add <archivo>` por archivo. Nunca `git add -A` ni `git add .`: otros
  agentes o sesiones pueden estar tocando el mismo repo, y el `-A` barre dumps y `.env`.
- Commit con pathspec: `git commit -m "..." -- <archivos>`. Antes del commit, `git diff --cached --name-only`
  para confirmar que solo entra lo propio.
- Mensajes en el idioma del repo (español en la plantilla), en modo imperativo, con una línea de resumen.
- Nunca `--no-verify` para esquivar un hook. Si un hook falla, se investiga y se arregla la causa. Si
  falla por algo ajeno a los archivos propios, se reporta con la salida real y no se saltea.

## 3. Push, PR y merge a `main`

El flujo real es este (no hay push directo a `main`):

1. El agente commitea en `dev`.
2. Para publicar, `git push origin dev` y luego `gh pr create --base main --head dev`. El push de
   `dev` lo hace el agente solo cuando el owner lo pide o cuando el flujo de PR lo necesita.
3. Esperar el CI del PR. Si falla, `pr-fix` antes de tocar nada más.
4. El merge a `main` lo hace el agente **solo con autorización explícita del owner en esa
   conversación**. Sin esa autorización, el PR queda abierto y se avisa.
5. Si el front depende de una migración que el CI de despliegue todavía no puede aplicar (por
   ejemplo, faltan los secretos del environment `produccion`), el merge lleva `[skip netlify]` en el
   título del commit: si no, Netlify publica el front antes que la base y las pantallas con login fallan.
6. Al mergear a `main`, el CI de despliegue de Supabase aplica las migraciones pendientes y las
   funciones cambiadas (ver `docs/guides/supabase-entornos-y-migraciones.md`). Cuando hay migraciones
   o funciones en el PR, el plan va en la descripción del PR.

Reglas que no cambian:

- **Nunca** `git push --force` a `main` ni a `dev`.
- **Nunca** un commit directo a `main`.
- Un PR a `main` es lo único que llega a producción: su descripción dice qué cambia para el usuario,
  qué migraciones entran y si hace falta `[skip netlify]`.

## 4. Definición de "listo"

Una tarea está terminada cuando las tres pasan, **ejecutadas de verdad**:

1. **Compila**: typecheck y build sin errores.
2. **Lint limpio**, donde esté configurado.
3. **Tests en verde**, donde existan.

Si algo falla, se reporta con la salida real. No se da por cumplido lo que no se corrió.
Un cambio de DB, permisos o comportamiento también requiere verificación en la app real o en la base
ephemeral, no solo que el build pase.

## 5. Preguntas al owner

- **Preguntar antes de asumir.** Falta información para planificar, una tabla, un rol o una regla de
  negocio → preguntar. No inventarlos.
- **Agentes de verificación** (buscar huecos, contradicciones o errores en un plan o en tareas):
  consumen muchos tokens. **Preguntar siempre antes de lanzarlos.**
- **Preguntar solo decisiones reales.** No preguntar "¿sigo?" ante un paso obvio: se hace.
- **Fin de sesión**: la sesión termina cuando no queda nada en que avanzar. Si una tarea se traba,
  se sigue con lo que no depende de esa respuesta y la pregunta queda asentada en el archivo de estado.
- Cosas que solo el owner puede hacer (paneles web, credenciales, decisiones): se listan como
  pendiente con ⏸️ y no se intenta hacerlas.

## 6. Repos de cliente

Pueden tener datos reales, credenciales y NDA. Ante la duda, preguntar antes de exponer algo.
No mezclar nombres, roles ni prefijos de un proyecto en otro.

## 7. Seguridad mínima

- Ningún secreto en el repo ni en `.env.example` (solo placeholders).
- Sin `service_role` en servidores ni en el cliente: el acceso administrativo va por funciones SQL
  con el rol del administrador y `aal2`.
- Prod es de solo lectura para el agente (ver la guía de Supabase).
