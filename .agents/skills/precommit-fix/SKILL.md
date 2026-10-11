---
name: precommit-fix
description: "Resuelve un bloqueo del pre-commit local ejecutando el hook y analizando la salida real: primero formato, luego lint, tipos y tests. Usala cuando un commit falle o el usuario diga que no puede commitear. NO usarla para checks de un PR en CI (pr-fix) ni para desactivar reglas."
---

# precommit-fix

Protocolo para resolver bloqueos de commit ejecutando el hook y analizando el output real.

## Communication
- Use `caveman` (ultra-terse).
- Only technical data. No prose.

## Mandatory Flow

### PASO 1 — Ejecución Inicial
- Comando: `node scripts/run-lint-staged.mjs`
- Capturar output exacto. Identificar paso fallido (lint-staged, tsc, vitest).

### PASO 2 — Análisis de Errores
- Extraer archivos y líneas afectadas del output.
- Clasificar: Estilo (Prettier), Lint (ESLint), Tipos (TS), Lógica (Tests).

### PASO 3 — Resolución (Orden Obligatorio)
1. **Prettier**: `npx prettier --write <archivos>`
2. **ESLint**: `npx eslint --fix <archivos>`. Resolver manuales restantes.
3. **TypeScript**: `npx tsc --noEmit`. Manual siempre. Reportar al usuario antes de actuar.
4. **Tests**: `npx vitest run <archivo_test>` para ver fallo completo y corregir.

### PASO 4 — Verificación
- Re-ejecutar: `node scripts/run-lint-staged.mjs`.

### PASO 5 — Ciclo / Escalamiento
- Si falla → Repetir (max 3 ciclos).
- Si persiste o fix no es claro → Escalar a usuario con error exacto y opciones.

## Strict Rules
- **NO `eslint-disable`**: Prohibido. Solo si es falso positivo justificado con comentario.
- **NO `any`**: Prohibido. Usar tipado real o `unknown`.
- **NO Config Escape**: Prohibido modificar `.eslintrc`, `tsconfig.json` o `.prettierrc` para evadir el error.
- **Transparencia**: Reportar errores de TS antes de intentar corregirlos manualmente.

## Trigger
- User mentions: "pre-commit falló", "lint error", "no puedo commitear", "hook error".
- Automático al fallar un commit local.
