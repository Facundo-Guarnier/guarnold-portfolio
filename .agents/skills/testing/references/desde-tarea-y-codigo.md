# Generar tests desde una tarea o desde código

Este archivo amplía el procedimiento de `testing/SKILL.md`. Las reglas de fondo (anti-trivialidad,
origen de cada `it()`, nombres) están allí.

## Desde una tarea (`#YYYY-XXXX`)

Entradas: `.agents/tasks/YYYY-XXXX.md` (§A criterios, §V invariantes citados) y `SPEC.md` (§V global).

Ejemplo de mapeo:

| Criterio §A | Tipo | Archivo | Test |
|---|---|---|---|
| "el botón guardar queda deshabilitado sin cambios" | componente | `src/components/Perfil.tsx` | `tests/unit/components/Perfil.test.tsx` |
| "rol carrier no ve el panel interno" | gating | `src/components/Panel.tsx` | `tests/unit/components/Panel.test.tsx` |
| "RLS impide leer filas de otro usuario" | integración SQL | — | fuera de unit: `tests/rls/` |

Cada criterio que no entra en unit se anota en el reporte como "no cubrible en unit", con el motivo.

## Desde código (`src/...`)

1. Listar solo la lógica propia con ramas.
2. Funciones puras: un test por rama, con entrada y salida.
3. Componentes: render con Testing Library y mock de dependencias externas. Aserciones sobre lo que el
   usuario ve (texto, `disabled`, presencia condicional), no sobre estado interno.

## Formato del reporte final

```
## generado
tests/unit/lib/carrier-status.test.ts: 7 tests (ramas de getCategoryStatus, getRatingGrade)
tests/unit/components/UserMenu.test.tsx: 5 tests (gating de rol y signOut)

## §A no cubrible en unit
"RLS interno impide auto-promoción de superadmin": test SQL de integración, fuera de este alcance.

## verificación
npx vitest run: 12 pasan.
Mutación de la rama A: el test falla (no es trivial).
```
