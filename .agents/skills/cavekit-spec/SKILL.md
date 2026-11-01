---
name: cavekit-spec
description: "Crea o edita SPEC.md y las tareas en GuarNote (vía su MCP): distilla un proyecto nuevo, crea una tarea, extrae la spec del código o enmienda un invariante o una tarea abierta. Es el único que modifica la spec y el contenido de las tareas. Usala cuando el usuario pida una tarea nueva, una spec o cambiar un criterio. NO usarla para implementar código (cavekit-build) ni para registrar un bug con causa (cavekit-backprop)."
---

# spec: mutador de SPEC.md y de las tareas

Esta skill es la única que modifica `SPEC.md` y el contenido de las tareas. Las tareas viven en
**GuarNote** y se escriben con su MCP (`create_task`, `update_task`, `add_task_comment`). Ya no se
crean archivos en `.agents/tasks/`: los que hay son historial de solo lectura.

Antes de escribir, cargá la skill `cavekit-spec-encoding` (la gramática comprimida para la spec y
para el `content` de una tarea) y leé `docs/guides/tareas-en-guarnote.md` §«Formato de una tarea»:
ahí está dónde va cada sección (§R, §V, §P, §A, §B, notas, §S).

Precondición: el MCP `guarnote` está disponible y autenticado, y sabés el `project_id` (el
`AGENTS.md` del repo declara «Proyecto en GuarNote: …»; se busca con `list_projects`). Si el MCP no
está, avisale al owner y frená: no se crea la tarea en un archivo local.

## Cómo elegir el modo

Mirá el pedido del usuario y el estado del proyecto, y elegí el primer caso que aplique:

1. No hay `SPEC.md` en la raíz y el pedido describe una idea: modo NEW_PROJECT.
2. Hay `SPEC.md` y el pedido describe una funcionalidad o tarea nueva: modo NEW_TASK.
3. Hay `SPEC.md` y el pedido incluye `from-code`: modo DISTILL.
4. Hay `SPEC.md` y el pedido empieza con `bug:`: modo BACKPROP (actualiza `details.errors` de la tarea
   y la §V de `SPEC.md`; ver más abajo).
5. Hay `SPEC.md` y el pedido empieza con `amend`: modo AMEND.
6. Hay `SPEC.md` y no vino ningún argumento: preguntale al usuario qué modo quiere.

## NEW_PROJECT: de la idea a la spec

1. Escribí el objetivo en una línea, con la gramática de spec. Va en la sección §G.
2. Listá las restricciones que el usuario dijo o que se desprenden de lo dicho. Van en §C.
3. Listá las superficies externas que el usuario nombró (APIs, pantallas, integraciones). Van en §I.
4. Proponé invariantes iniciales, numerados V1, V2, etc. Van en §V.
5. Escribí todo en `SPEC.md`. No crees las secciones §T ni §B en la spec.
6. Para cada tarea inicial, seguí el modo NEW_TASK.

## NEW_TASK: de la funcionalidad a la tarea en GuarNote

1. **No pidas ni inventes un ID.** Lo asigna la base: es la razón de que las tareas vivan ahí (dos
   ramas o dos agentes en paralelo no pueden chocar).
2. Llamá a `create_task` con:
   - `title`: corto y accionable.
   - `content`: en Markdown, con la gramática de `cavekit-spec-encoding`, las secciones `## §R`
     (requerimiento: el qué, en bullets), `## §V` (invariantes de `SPEC.md` y aprendizajes que la tarea
     cita) y `## §P` (proceso: migración, servicio, UI, tipos, verificación).
   - `details.acceptance_criteria`: una condición verificable por ítem, todas con `done: false`. Es lo
     que dice cuándo la tarea está terminada; una tarea sin criterios no se puede cerrar con evidencia.
   - `details.considerations`: alcance, lo que queda fuera y por qué, decisiones tomadas.
   - `details.references`: el plan que implementa (`plans/NOMBRE-AAAA-MM.md`), si hay.
   - `status`: `todo` (o `planning` si todavía falta definir algo), y `priority` si el owner la dio.
   - `kind`: `technical` (el valor por defecto de la tool: la crea un agente). `human` solo si se
     transcribe un pedido de una persona y debe aparecer así en el tablero.
3. La respuesta trae `task_number`. La tarea se nombra `#AAAA-XXXX` (año actual y el número con
   cuatro dígitos), que es como la muestra la app.
4. Agregá el primer registro con `add_task_comment`: `todo — creada`.
5. No crees además un archivo en `.agents/tasks/`: la fila en GuarNote es el registro.

## DISTILL: del código a la spec

Recorré el repo y producí §G, §C, §I y §V en `SPEC.md`. Las tareas que surjan se crean con NEW_TASK,
después de confirmarlas con el usuario.

## BACKPROP: del bug a `errors` y §V

Agregá la fila del bug (`id|date|cause|fix`) a `details.errors` de la tarea activa con `update_task`
(mandá la tabla completa: la sección se reemplaza entera), y la §V de `SPEC.md` si el bug revela una
regla general. Sumá un comentario `bug — <causa en una línea>`. Si no hay tarea activa, pedí el ID.

## AMEND: edición puntual

El argumento es `amend §V.3` para `SPEC.md`, o `amend #AAAA-XXXX` para una tarea. Cambiá solo el
elemento indicado.

Una tarea **cerrada** (`done` o `canceled`) no se enmienda: es inmutable, como una migración. Un cambio
de alcance sobre algo cerrado es una tarea nueva (NEW_TASK) que cita a la anterior en
`details.references`, más un comentario en la anterior que apunta a la nueva. En una tarea abierta,
toda enmienda de `content` o de criterios deja un comentario `amend — <qué cambió y por qué>`.

## Autorrevisión del plan contra la spec (opcional)

Paso opcional, para tareas con un plan de implementación o con requisitos que se pueden perder. Una
vez escrita la tarea, se relee con la spec al lado y se revisa:

1. **Cobertura.** Cada requisito de §R y cada invariante citado en §V tiene que tener un lugar donde
   se cumple y un criterio de aceptación que lo verifique. Si alguno no tiene, se agrega el paso o se
   anota el hueco.
2. **Nombres consistentes.** Los mismos términos, campos y funciones se usan igual en toda la tarea y
   en `SPEC.md`. Un nombre que cambia entre secciones es un error.
3. **Sin pasos ambiguos.** Cada paso se puede ejecutar de una sola manera razonable. Frases como
   "manejar casos borde" o "agregar validación apropiada" se reemplazan por lo concreto o se marcan
   como pregunta para el owner.

Las correcciones se hacen con `update_task` antes de empezar a implementar. Si un hueco exige una
decisión que no está en la spec, es una pregunta al owner, no una suposición.

Adaptado de obra/superpowers (MIT), commit bb92a77741419a4ab5f06e711a283343f1ada0c3.

## Reglas de salida

- El formato de `SPEC.md` y del `content` de las tareas sale de la skill `cavekit-spec-encoding`.
- Tareas: una fila en GuarNote, creada con `create_task`. Nunca un archivo en `.agents/tasks/`.
- Spec: `SPEC.md`. No tiene secciones §T ni §B.
- Los IDs son `#AAAA-XXXX` con el `task_number` que devuelve la base. Los archivos viejos de
  `.agents/tasks/` se citan por su ruta, para no confundir sus IDs con números de GuarNote.

## Fuera de alcance

- No inventes ni pidas IDs para crear: los pone la base.
- No edites `SPEC.md` para registrar listas de tareas o de bugs.
- No cambies el `status` de una tarea para reflejar trabajo hecho: eso es de `cavekit-build`.
