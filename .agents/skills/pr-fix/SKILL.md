---
name: pr-fix
description: "Diagnostica y resuelve fallos en los checks de un Pull Request (CI/CD): corre localmente los mismos pasos del workflow, clasifica los fallos y los corrige con verificación final. Usala cuando el usuario diga que un PR o un workflow falló. NO usarla para fallos del pre-commit local (precommit-fix) ni para escribir tests nuevos (testing)."
---

# pr-fix

Protocolo para auditar, listar, preguntar y solucionar errores antes o durante la ejecución de un Pull Request a `main`.

## Communication
- Use `caveman` (ultra-terse).
- Only technical data. No prose.

## Mandatory Flow

### PASO 1 — Auditoría Local de PR (CI Mock)
Ejecutar los checks de integración locales secuencialmente para replicar el workflow de GitHub Actions:
1. **Linter & Formatter & Unit/Int Tests**:
   `node scripts/run-lint-staged.mjs`
2. **React Doctor Audit**:
   `npx react-doctor@latest --fail-on error --offline`
3. **RLS Tests** (Preguntar si se tiene Docker iniciado):
   `vitest run tests/rls`
4. **E2E Tests** (Preguntar si la app está corriendo):
   `npx playwright test`

### PASO 2 — Clasificar y Listar
Presentar al usuario la lista consolidada de fallos clasificados por nivel de severidad y origen:
- `🔴 CRITICAL`: Fallos de Tests (Unit/Int/RLS/E2E) o React Doctor.
- `🟡 WARNING/ERROR`: Fallos de Tipado (TSC) o Lint/Style (ESLint/Prettier).

### PASO 3 — Preguntar e Interactuar
- Ante fallos de lógica (`🔴 CRITICAL`), presentar el error exacto y proponer 2-3 vías de solución.
- Solicitar confirmación del usuario antes de realizar refactors extensos en archivos de lógica de negocio o de base de datos.

### PASO 4 — Resolución Sistemática
1. **Correcciones automáticas**:
   - `npx prettier --write <archivos>`
   - `npx eslint --fix <archivos>`
2. **Correcciones manuales guiadas**:
   - Errores TSC: Arreglar contratos/interfaces sin usar `any`.
   - React Doctor: Resolver anti-patrones en el render o en el uso de hooks.
   - Tests: Ejecutar el test específico (`npx vitest run <test_file>`) con variables mockeadas para depurar.

### PASO 5 — Re-verificación
- Re-ejecutar únicamente los checks fallidos.
- Si todos están en verde (exit code `0`), reportar éxito.

## Strict Rules
- **Trazabilidad**: Todo archivo de test o story modificado/creado debe incluir `// Task: #YYYY-XXXX` al inicio.
- **Sin atajos**: Prohibido el uso de `// @ts-ignore`, `// @ts-nocheck` o `/* eslint-disable */` para evadir checks de PR.
- **Limpieza**: Remover cualquier archivo de test temporal (`trivial.test.ts`, etc.) o debuggers (`console.log`) antes de dar por cerrada la sesión.

## Trigger
- User mentions: "pr falló", "errors en pr", "test.yml falló", "react-doctor falló", "CI/CD error", "/pr-fix".
