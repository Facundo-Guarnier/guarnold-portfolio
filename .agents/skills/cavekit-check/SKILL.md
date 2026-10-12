---
name: cavekit-check
description: "Detecta desvíos entre SPEC.md, las tareas de GuarNote (leídas por su MCP) y el código: invariantes que no se cumplen, interfaces que cambiaron y tareas marcadas como hechas sin evidencia. Solo lectura, no modifica nada. Usala cuando el usuario pida verificar, revisar desvíos o ver el estado de la spec. NO usarla para corregir (cavekit-backprop o cavekit-build) ni para auditorías amplias de seguridad (cavekit-audit)."
allowed-tools: Read Grep Glob Bash(git status *) Bash(git log *) Bash(git show *) mcp__guarnote__list_projects mcp__guarnote__list_tasks mcp__guarnote__get_task
---

# check: reporte de desvíos

Es un diagnóstico puro: informa las violaciones y no escribe nada, ni en el repo ni en GuarNote.

## Carga

1. Leé `SPEC.md`.
2. Tareas del proyecto en GuarNote: `list_tasks` (filtrando por `status` según el control) y
   `get_task` de cada una que se vaya a revisar. Si el MCP no está disponible, hacé solo los controles
   de §V e §I y decí que el de tareas no se pudo correr.
3. Interpretá los argumentos de la invocación:
   - `§V`: revisa los invariantes globales (es el valor por defecto).
   - `§I`: revisa las interfaces.
   - `tasks`: audita el estado de las tareas contra el código.
   - `--all`: hace los tres controles.

## Control de §V: invariantes

Para cada invariante V<n> de `SPEC.md` y de las tareas abiertas (su `## §V`):

1. Traducí el invariante a una afirmación verificable sobre el código.
2. Buscá (grep) y leé los archivos relevantes.
3. Clasificá el resultado como HOLD (se cumple), VIOLATE (no se cumple) o UNVERIFIABLE (no se puede verificar).
4. Registrá la dirección y la evidencia en forma de archivo:línea.

## Control de §I: interfaces

Para cada elemento I de `SPEC.md`:

1. Ubicá la implementación.
2. Clasificá el resultado como MATCH (coincide), DRIFT (cambió), MISSING (falta) o EXTRA (sobra).

## Control de tareas

Sobre las tareas del proyecto:

1. `done`: verificá que el trabajo declarado (criterios tildados, `references`) esté en el código.
   Marcá como STALE la que no tenga evidencia, y como INCOMPLETE la que esté `done` con criterios sin
   tildar.
2. `doing` / `qa`: anotá su estado y el último comentario.
3. Los archivos viejos de `.agents/tasks/` son historial: no se auditan salvo que el usuario lo pida.

## Reporte

Es un reporte terso, agrupado por severidad:

```
## desvíos de §V globales (SPEC.md)
V2 VIOLATE: auth/mw.go:47 usa `<` en lugar de `≤`.

## desvíos de tareas (GuarNote)
#2026-0007 HOLD: la lógica de borrado lógico está presente.
#2026-0008 VIOLATE: falta el chequeo de deleted_at en la consulta.
#2026-0011 INCOMPLETE: done con 1/3 criterios tildados.

## resumen
1 violación. 1 incompleta.
siguiente: cavekit-spec `bug: <ID de tarea>` (modo BACKPROP).
```

## Fuera de alcance

- Cero escrituras. No se editan `SPEC.md` ni las tareas (nada de `update_task` ni `add_task_comment`).
- No se generan IDs.
