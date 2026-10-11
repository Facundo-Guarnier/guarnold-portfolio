---
name: cavekit-check
description: "Detecta desvíos entre SPEC.md, las tareas y el código: invariantes que no se cumplen, interfaces que cambiaron y tareas marcadas como hechas sin evidencia. Solo lectura, no modifica nada. Usala cuando el usuario pida verificar, revisar desvíos o ver el estado de la spec. NO usarla para corregir (cavekit-backprop o cavekit-build) ni para auditorías amplias de seguridad (cavekit-audit)."
allowed-tools: Read Grep Glob Bash(git status *) Bash(git log *) Bash(git show *)
---

# check: reporte de desvíos

Es un diagnóstico puro: informa las violaciones y no escribe nada.

## Carga

1. Leé `SPEC.md`.
2. Leé todos los archivos `.agents/tasks/YYYY-XXXX.md`.
3. Interpretá los argumentos de la invocación:
   - `§V`: revisa los invariantes globales (es el valor por defecto).
   - `§I`: revisa las interfaces.
   - `tasks`: audita el estado de las tareas contra el código.
   - `--all`: hace los tres controles.

## Control de §V: invariantes

Para cada invariante V<n> de `SPEC.md` y de los archivos de tarea:

1. Traducí el invariante a una afirmación verificable sobre el código.
2. Buscá (grep) y leé los archivos relevantes.
3. Clasificá el resultado como HOLD (se cumple), VIOLATE (no se cumple) o UNVERIFIABLE (no se puede verificar).
4. Registrá la dirección y la evidencia en forma de archivo:línea.

## Control de §I: interfaces

Para cada elemento I de `SPEC.md`:

1. Ubicá la implementación.
2. Clasificá el resultado como MATCH (coincide), DRIFT (cambió), MISSING (falta) o EXTRA (sobra).

## Control de tareas

Para cada archivo de tarea:

1. Si está en `done`, verificá que el trabajo declarado esté presente.
2. Si está en `in_progress`, anotá su estado.
3. Marcá como STALE las tareas `done` que no tengan evidencia.

## Reporte

Es un reporte terso, agrupado por severidad:

```
## desvíos de §V globales (SPEC.md)
V2 VIOLATE: auth/mw.go:47 usa `<` en lugar de `≤`.

## desvíos de tareas (.agents/tasks/)
#2026-0007 HOLD: la lógica de borrado lógico está presente.
#2026-0008 VIOLATE: falta el chequeo de deleted_at en la consulta.

## resumen
1 violación. 1 obsoleta.
siguiente: cavekit-spec `bug: <ID de tarea>` (modo BACKPROP).
```

## Fuera de alcance

- Cero escrituras. No se editan `SPEC.md` ni las tareas.
- No se generan IDs automáticamente.
