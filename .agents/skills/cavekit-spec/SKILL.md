---
name: cavekit-spec
description: "Crea o edita SPEC.md y las tareas .agents/tasks/YYYY-XXXX.md: distilla un proyecto nuevo, agrega una tarea, extrae la spec del código o enmienda un invariante. Es el único que modifica spec y tareas. Usala cuando el usuario pida una tarea nueva, una spec o cambiar un criterio. NO usarla para implementar código (cavekit-build) ni para registrar un bug con causa (cavekit-backprop)."
---

# spec: mutador de SPEC.md y de las tareas

Esta skill es la única que modifica `SPEC.md` y los archivos de `.agents/tasks/`. Antes de escribir
cualquier cosa, cargá la skill `cavekit-spec-encoding`: ahí está la gramática comprimida que aplica a
toda escritura de spec y de tarea. La estructura de una tarea sale de `.agents/tasks/_TEMPLATE.md`.
El archivo `FORMAT.md` no existe; la gramática vive en esa skill.

## Cómo elegir el modo

Mirá el pedido del usuario y el estado del proyecto, y elegí el primer caso que aplique:

1. No hay `SPEC.md` en la raíz y el pedido describe una idea: modo NEW_PROJECT.
2. Hay `SPEC.md` y el pedido describe una funcionalidad o tarea nueva: modo NEW_TASK (ID local) o
   NEW_TASK_MCP (ID que asigna la base). Antes de elegir, leé la sección "ID: local o MCP".
3. Hay `SPEC.md` y el pedido incluye `from-code`: modo DISTILL.
4. Hay `SPEC.md` y el pedido empieza con `bug:`: modo BACKPROP (actualiza la sección §B de la tarea y
   la §V de `SPEC.md`; ver más abajo).
5. Hay `SPEC.md` y el pedido empieza con `amend`: modo AMEND.
6. Hay `SPEC.md` y no vino ningún argumento: preguntale al usuario qué modo quiere.

## NEW_PROJECT: de la idea a la spec

1. Escribí el objetivo en una línea, con la gramática de spec. Va en la sección §G.
2. Listá las restricciones que el usuario dijo o que se desprenden de lo dicho. Van en §C.
3. Listá las superficies externas que el usuario nombró (APIs, pantallas, integraciones). Van en §I.
4. Proponé invariantes iniciales, numerados V1, V2, etc. Van en §V.
5. Escribí todo en `SPEC.md`. No crees las secciones §T ni §B en la spec.
6. Para cada tarea inicial, seguí el modo NEW_TASK.

## NEW_TASK: de la funcionalidad al archivo de tarea

1. El ID de la tarea tiene que venir explícito en el pedido, con el formato `#YYYY-XXXX`.
2. No inventes, infieras ni mapees IDs desde ninguna fuente: ni tareas anteriores, ni fechas, ni nada.
3. Si falta el ID, preguntale al usuario: "¿Cuál es el ID de la tarea?". Esperá su respuesta antes de
   crear cualquier archivo.
4. Creá `.agents/tasks/YYYY-XXXX.md` solo después de recibir el ID explícito.
5. La estructura del archivo es:
   - Encabezado `# #YYYY-XXXX — <nombre>`.
   - Sección §R (requerimiento).
   - Sección §V (invariantes de `SPEC.md` que la tarea cita).
   - Sección §P (proceso).
   - Sección §B (bugs), vacía al crear.
   - Sección §S (estado): un registro fechado que solo se agrega al final. La fila inicial es
     `- [YYYY-MM-DD] todo — creada`.

## ID: local o MCP

Hay dos formas de asignar el número de tarea, y conviven a propósito. Ninguna reemplaza a la otra
todavía.

| | NEW_TASK (local) | NEW_TASK_MCP |
|---|---|---|
| Quién asigna el ID | El usuario, a mano | La secuencia de Postgres `guarnote.tasks.task_number` |
| Dónde vive | `.agents/tasks/YYYY-XXXX.md`, en este repo | Una fila en `guarnote.tasks`, en la base (compartida entre ramas) |
| Choque entre ramas o agentes en paralelo | Posible. Es el problema que motiva esta tabla | Imposible por construcción: la secuencia no repite números |
| Cuándo usarla | El repo no tiene proyecto GuarNote configurado, o se quiere el archivo Markdown versionado en git | Hay un PAT de MCP de GuarNote activo para este repo (`.mcp.json` o la configuración del cliente) y de verdad importa que el número no choque |

Ninguna de las dos es la obligatoria. Si el usuario no dijo cuál quiere, preguntale, igual que se
pregunta el ID en NEW_TASK. Para ver cómo se referencia el servidor `gn-mcp-server` en general, mirá
`.agents/skills/db-new-migrations`. Acá lo único que importa es la herramienta `create_task`.

## NEW_TASK_MCP: de la funcionalidad a la tarea en GuarNote vía MCP

Precondición: hay un servidor MCP `guarnote` configurado y autenticado, con un PAT `gnmcp_...` emitido
por `POST .../gn-mcp-server/issue-token` (ver el JSDoc de `supabase/functions/gn-mcp-server/index.ts`).
Si no está configurado, usá NEW_TASK.

1. Llamá a la herramienta `create_task` del servidor `guarnote` con `title` (obligatorio) y, si
   corresponde, `content`, `status`, `priority` y `kind`.
   - `kind` acepta `"human"` o `"technical"`. El valor por defecto de esta herramienta es `"technical"`,
     porque quien llama es un agente de IA, que es justamente el caso para el que existe ese campo
     (tarea #2026-0080, `guarnote.tasks.kind`). Usá `"human"` solo si la tarea se crea a nombre de una
     persona, transcribiendo un pedido suyo, y debe aparecer así en el tablero.
   - No envíes `project_id`. El token ya fija el proyecto (un PAT equivale a un proyecto). Si lo enviás,
     la herramienta lo ignora y usa el del token, por diseño (ver "Decisión de diseño 2" en el JSDoc del
     servidor).
2. La respuesta trae `task_number`, que ya viene asignado y es único, sin coordinación manual. Usalo tal
   cual para referirte a la tarea (`Tarea #<task_number>`). No inventes un año y un serial como en el ID
   local.
3. No crees además un archivo en `.agents/tasks/` para esa misma tarea: la fila en la base es el
   registro. Si hace falta una copia local en Markdown, es una decisión aparte y explícita, no un paso
   automático de este flujo.
4. Las secciones §R, §V, §P, §B y §S siguen siendo la forma de pensar y comunicar la tarea. Van en el
   campo `content` de `create_task`, en Markdown, con la misma estructura de `_TEMPLATE.md`. Lo único que
   cambia es el encabezado `# #YYYY-XXXX — <título>`, que no aplica porque no hay un año y un serial que
   inventar.
5. Para retomar una tarea, usá `list_tasks` (filtrando por `status` o `kind`) y después `update_task` con
   el `task_id` (UUID) que devolvió `create_task`.

## DISTILL: del código a la spec

Recorré el repo y producí §G, §C, §I y §V en `SPEC.md`. Para las tareas, pedí los IDs al usuario antes
de crear archivos en `.agents/tasks/`.

## BACKPROP: del bug a §B y §V

Actualizá la sección §B del archivo de la tarea activa, y la §V de `SPEC.md` si el bug revela una regla
general. Si no hay tarea activa, pedí el ID.

## AMEND: edición puntual

El argumento es `amend §V.3` para `SPEC.md`, o `amend #YYYY-XXXX` para un archivo de tarea. Cambiá solo
el elemento indicado.

## Autorrevisión del plan contra la spec (opcional)

Paso opcional, para tareas con un plan de implementación o con requisitos que se pueden perder. Una
vez escrita la tarea (o el `content` de `create_task` en NEW_TASK_MCP), se relee con la spec al lado
y se revisa:

1. **Cobertura.** Cada requisito de §R y cada invariante citado en §V tiene que tener un lugar donde
   se cumple. Si alguno no tiene, se agrega el paso o se anota el hueco.
2. **Nombres consistentes.** Los mismos términos, campos y funciones se usan igual en toda la tarea y
   en `SPEC.md`. Un nombre que cambia entre secciones es un error.
3. **Sin pasos ambiguos.** Cada paso se puede ejecutar de una sola manera razonable. Frases como
   "manejar casos borde" o "agregar validación apropiada" se reemplazan por lo concreto o se marcan
   como pregunta para el owner.

Las correcciones se hacen en el mismo paso, sin commits intermedios: el archivo se commitea una sola
vez, al final. Si un hueco exige una decisión que no está en la spec, es una pregunta al owner, no una
suposición. §S no se toca: solo se agrega.

Adaptado de obra/superpowers (MIT), commit bb92a77741419a4ab5f06e711a283343f1ada0c3.

## Reglas de salida

- El formato de `SPEC.md` y de las tareas sale de la skill `cavekit-spec-encoding`.
- Tareas locales: `.agents/tasks/YYYY-XXXX.md`.
- Tareas MCP: una fila en `guarnote.tasks`, creada con la herramienta `create_task`. Por defecto no se
  guarda un archivo local espejo (ver NEW_TASK_MCP).
- Spec: `SPEC.md`.
- `SPEC.md` no tiene secciones §T ni §B.
- Los IDs son `#YYYY-XXXX` (local) o el `task_number` que devuelve la base (MCP). Nunca mezcles los dos
  formatos para una misma tarea.

## Fuera de alcance

- No generes IDs locales de forma automática. El `task_number` de NEW_TASK_MCP sí lo genera la base:
  esa es la razón de esa vía, no una excepción a esta regla.
- No edites `SPEC.md` para registrar listas de tareas o de bugs.
