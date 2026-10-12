# Tareas en GuarNote (por MCP)

Las tareas viven en **GuarNote**: los pendientes, su estado, su spec ejecutable y su historial. Ya no
se crean archivos en `.agents/tasks/` ni listas de pendientes en `TODO.md`. El agente las lee y las
escribe con el MCP de GuarNote. Así cada tarea tiene un número único asignado por la base (dos ramas
o dos agentes en paralelo ya no pueden crear el mismo ID) y se puede filtrar por estado, prioridad,
texto y fecha.

`plans/` y `SPEC.md` siguen en el repo: el plan (el qué y el porqué) y los invariantes globales son
documentación del proyecto y viajan con el código. Lo que se movió es la tarea.

## Configuración (una vez por máquina)

El MCP se registra a nivel **usuario**, no por repo, para que esté disponible en todos:

```bash
claude mcp add --transport http --scope user guarnote https://brzuaxeuqqqipkaennre.supabase.co/functions/v1/gn-mcp-server/mcp
```

Después, en Claude Code: `/mcp` → `guarnote` → **Authenticate**. Se abre el navegador, se entra con
Guarnold ID (hace falta la verificación en dos pasos activa) y se autoriza. El token se puede
revocar desde GuarNote → Ajustes → Asistentes de IA.

Otros clientes (Codex, Gemini, Cursor) tienen su propio archivo de servers MCP: misma URL, tipo
HTTP, sin headers.

⚠️ No se agrega `guarnote` al `.mcp.json` de un repo: quedaría duplicado con el global.

**Sin MCP no hay tareas.** Si el MCP no está disponible o no autentica, el agente se lo dice al owner
y no sigue con trabajo que requiera crear o actualizar una tarea. No se crea un archivo local "por
mientras": dos lugares para la misma tarea es justo lo que esto vino a eliminar.

## A qué proyecto pertenece este repo

El `AGENTS.md` de cada repo declara su proyecto en GuarNote, en la sección «Tareas»:

```markdown
Proyecto en GuarNote: <nombre exacto del proyecto>
```

El agente busca ese nombre con `list_projects` y usa su `id` como `project_id`. Si el `AGENTS.md`
no lo declara, se busca el proyecto con el nombre del repo. Si no aparece, se le pregunta al owner;
el agente no crea un proyecto por su cuenta.

## El ID de una tarea

La app muestra cada tarea como `#AAAA-XXXX`: el año de creación y el `task_number` con cuatro
dígitos. `#2026-0123` es `task_number: 123`. Es el mismo formato de ID que tenían los archivos de
`.agents/tasks/`, pero ahora lo asigna la base: **el agente no inventa ni pide un ID para crear**, lo
recibe de `create_task`.

Para trabajar sobre una tarea existente el ID sí tiene que venir del owner (o de una tarea que se
acaba de crear en la misma sesión). Si falta, se listan las pendientes y se pregunta cuál; no se
elige una por inferencia.

Los archivos viejos de `.agents/tasks/` quedan como **historial de solo lectura**. Sus IDs se citan
como archivo (`.agents/tasks/2026-0045.md`) para no confundirlos con un número de GuarNote.

## Tools

| Tool | Para qué |
|---|---|
| `list_projects` | Encontrar el `project_id` |
| `list_tasks` | Buscar. Filtros: `status` (uno o varios), `priority`, `kind`, `query` (texto), `created_after/before`, `updated_after/before`, `order`, `limit`/`offset`. Devuelve filas livianas con el avance de criterios (`criteria_done/criteria_total`) |
| `get_task` | Una tarea completa por `task_id` o `task_number`: descripción, detalle y comentarios |
| `create_task` | Crear. El número lo pone la base |
| `update_task` | Cambiar estado, texto o detalle. `details` se fusiona por sección; una sección en `null` se borra |
| `add_task_comment` | Agregar al registro de avance (solo agrega: no se editan ni borran comentarios) |

«Lo pendiente» es `status: ["planning", "todo", "doing", "qa"]`.

## Formato de una tarea

Las secciones de la spec de una tarea siguen siendo las mismas; cambia dónde vive cada una:

| Sección | Dónde va en GuarNote |
|---|---|
| ID `#AAAA-XXXX` | Lo asigna la base (`task_number`) |
| Título | `title` |
| §R requisito (el qué, en bullets) | `content`, bajo `## §R` |
| §V invariantes citados (de `SPEC.md`, aprendizajes) | `content`, bajo `## §V` |
| §P proceso (pasos: migración, servicio, UI, tipos, verificación) | `content`, bajo `## §P` |
| §A criterios de aceptación | `details.acceptance_criteria`: `[{ text, done }]`, uno por condición verificable |
| §B bugs (`id\|date\|cause\|fix`) | `details.errors`, como tabla Markdown con esas columnas |
| Notas: alcance, fuera de alcance, decisiones | `details.considerations` |
| Plan que implementa, commits, PRs, archivos | `details.references` |
| §S estado | `status` (el estado vivo) + **un comentario por transición** (el historial) |

El `content` usa la gramática comprimida de `cavekit-spec-encoding`, igual que antes en el archivo.
La forma de `details` la impone la base (un CHECK): una clave desconocida o un tipo equivocado se
rechaza.

### Estados

| Estado de la metodología | `status` | Comentario que se agrega |
|---|---|---|
| `todo` | `todo` (o `planning` si todavía se está definiendo) | `todo — creada` |
| `in_progress` | `doing` | `in_progress — empieza <qué>` |
| `partial` | queda en `doing` | `partial — hecho: <X>; falta: <Y>` |
| `blocked` | queda en `doing` o `todo` | `blocked — <por qué y qué lo destraba>` |
| listo para que el owner lo pruebe | `qa` | `qa — <qué probar>` |
| `done` | `done` | `done — cerró <qué>`, con el commit o PR |
| descartada | `canceled` | `canceled — <por qué>` |

Una tarea con criterios sin tildar no está `done`: o se tildan con evidencia, o queda `partial` y se
dice qué falta.

## Las tareas son inmutables (como las migraciones)

Igual que con los archivos, el historial no se reescribe:

- El registro de avance son los comentarios, y **solo se agregan**. Una corrección es un comentario
  nuevo que dice qué estaba mal.
- Una tarea cerrada (`done` o `canceled`) no se edita: ni título, ni `content`, ni criterios. Se le
  pueden agregar comentarios y referencias.
- Un cambio de alcance o una corrección de algo cerrado es una **tarea nueva**, que cita a la anterior
  en `references`; en la anterior se agrega un comentario que apunta a la nueva.
- Lo que se descubrió vale más que lo que se hizo: un ítem que resultó ya hecho o mal diagnosticado
  queda anotado como tal (en `errors` o en un comentario), para no volver a investigarlo.

## Flujo

1. **Al empezar**: `list_tasks` con lo pendiente del proyecto, o `get_task` si el owner nombró una.
2. **Al tomarla**: `update_task` → `status: "doing"` + comentario `in_progress — …`.
3. **Mientras se trabaja**: los bugs con causa van a `errors`; las decisiones que no se ven en el
   código, a `considerations` o a un comentario.
4. **Al cerrar**: criterios tildados, commit o PR en `references`, `status: "done"` (o `"qa"`) y el
   comentario de cierre.
5. **Algo nuevo que aparece y no se va a hacer ahora**: `create_task` con `acceptance_criteria`, en
   vez de anotarlo en un markdown.

El commit que cierra una tarea la cita: `#AAAA-XXXX — <objetivo>`.

## Límite conocido

Solo un agente con el MCP autenticado ve las tareas. El CI y los agentes en la nube que no tienen
el MCP configurado no las ven. Si un flujo automático necesita una tarea, se la pasa en el pedido.
