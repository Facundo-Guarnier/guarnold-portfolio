---
name: multilayer-flow-verification
description: "Verifica que los flujos de negocio de un módulo existan y concuerden de punta a punta: UI, permisos y backend. Combina trazado estático en tres capas, verificación funcional en DB con rollback, tests y revisión adversarial de migraciones. Usala antes de liberar o migrar un módulo con permisos. NO es E2E de navegador ni reemplaza la revisión visual humana."
---

# Verificación Multicapa de Flujos

Metodología para validar que un conjunto de flujos de negocio **existe y es correcto en las 3 capas** (UI → permiso → backend), no solo en la base de datos. Agnóstica de framework/backend/dominio.

**Esto NO es E2E de navegador.** Nadie clickea la app. Es trazado estático de código + verificación funcional contra la base real + tests/typecheck + revisión adversarial de migraciones. Cubre permisos, RLS y coherencia entre capas (lo que E2E no cubre); NO cubre la experiencia visual (lo que E2E y el ojo humano sí). Corré esto ANTES de la revisión humana, no en su lugar.

Referencia humana extensa (si existe en el proyecto): `docs/guides/multilayer-flow-verification.md`. Este skill es la versión ejecutable.

## El principio

Un paso de un flujo no está "hecho" hasta que sus 3 capas están y **concuerdan**:

```
CAPA 1 UI       → botón/form existe, gateado por can('x') / hasRole / ProtectedRoute
CAPA 2 PERMISO  → qué autorización hace falta
CAPA 3 BACKEND  → RPC/RLS/trigger que ejecuta y REVALIDA server-side
```

Modos de falla que buscás: (a) falta Capa 1 = feature fantasma; (b) Capa1≠Capa3 = UX rota o agujero de seguridad; (c) validación solo en Capa 1 = esquivable por API directa.

## Procedimiento

### Paso 0 — Encuadre
1. **Listar los flujos** del módulo (del plan, del spec, o distilados del código). Numerarlos F1, F2, … Cada flujo = secuencia de pasos.
2. Por flujo, identificar **dónde vive cada capa**: rutas de las páginas/componentes (UI), sistema de permisos (can/hasRole/policy), y las funciones de base (RPC/RLS/trigger).
3. Confirmar el **comando de typecheck correcto** del proyecto (¡ojo con monorepos/solution files que devuelven exit 0 sin chequear `src/`!) y qué **errores preexistentes** filtrar.

### Paso 1 — Técnica A: Trazado estático 3-capas (subagentes en paralelo)

El trazado de cada flujo lee mucho código. **Un subagente por flujo** (modelo capaz, Sonnet u Opus, no
Haiku), con contexto limpio. Cada subagente devuelve al principal únicamente la tabla del flujo con su
veredicto por paso y la evidencia `archivo:línea`. El código leído no vuelve al contexto principal.
Levantar **un agente por flujo** (modelo capaz — Sonnet u Opus, NO el más chico; se le escapan los mismatches sutiles). Cada agente, **leyendo el código real** (no asumiendo), sigue por cada paso:
```
botón (archivo:línea) → gating can('x') → hook → service → RPC/policy (archivo:línea)
  → ¿el permiso del botón == el permiso del RPC?   ← chequeo clave
```
y verifica: existe en UI (no solo en DB), permisos coinciden, validaciones en AMBAS capas (no solo el form), empty states y manejo de error presentes.

Salida **estructurada por schema** (no texto libre), veredicto por paso ✅/⚠️/❌ con evidencia `archivo:línea`. Ver `AGENTS.md` local para la lista de agentes disponibles y el modelo a usar.

### Paso 2 — Técnica B: Verificación funcional en DB real
Para cada flujo con estado mutante, ejecutar SQL contra la base real en **transacción con ROLLBACK**, **suplantando usuarios reales** (inyectar claims de auth). Probar SIEMPRE los dos casos:
1. **Camino feliz con rol correcto** → estado resultante exacto (saldos, ledger, transiciones).
2. **Rol SIN permiso** → rechazo (`insufficient_privilege` o equivalente).
Siempre `ROLLBACK`: la verificación no deja datos.

### Paso 3 — Técnica C: Tests + typecheck
Suite de tests sobre lógica pura (máquinas de estado, cálculos, validadores). Typecheck **con el comando correcto** (el que incluye el código fuente). Filtrar errores preexistentes, exigir **cero errores NUEVOS**. Cuidado con configs `strict:false` (narrowing por discriminante booleano puede fallar → usar narrowing por operador de pertenencia).

### Paso 4 — Técnica D: Revisión adversarial de migraciones
Antes de aplicar CADA migración: un agente revisor la lee **para romperla** (firmas/drift, SECURITY DEFINER sin guard, idempotencia, CHECKs de invariantes, RLS que filtra de más, destructivo escondido) + un verificador independiente que confirma/refuta. Recién con los dos de acuerdo, aplicar. Si el proyecto tiene un skill/agente de revisión de migraciones, usarlo.

### Paso 5 — Reporte y cierre
Tabla por flujo: `Flujo | Paso | Capa1 | Capa3 | ¿Coincide? | Veredicto | Evidencia`. Cierre con:
- Resumen X ✅ / Y ⚠️ / Z ❌.
- **Menores** arreglados (commit).
- **Grandes** reportados para decisión del dueño — NO arreglar unilateralmente cambios de alcance/producto.
- **Qué NO se cubrió**: experiencia visual, E2E de navegador, integración con terceros, performance. Agendar la revisión humana página por página como paso siguiente.

## Reglas de oro
- Nombralo por lo que es (trazado + verificación), NUNCA "E2E" — evita falsa confianza.
- Verificar solo la Capa 3 no alcanza: confirmá que hay UI que la llama con el permiso correcto.
- La validación del formulario NO es seguridad: el back debe revalidar.
- Typecheck con el comando que SÍ chequea el código fuente.
- Migraciones críticas: revisor adversarial + segundo verificador. Uno solo no alcanza.
- Sin caps silenciosos: si cubriste 6 de 9 flujos, decilo.
- **Límite implícito de filas**: PostgREST corta en ~1000 por defecto (y un `.limit(500)` a mano, más abajo). Al filtrar/matchear/contar/agregar sobre un conjunto, ese corte **pierde filas en silencio** → un "no existe" que sí existe pasado el límite. Antes de matchear/escanear "todos" los X: subir/quitar el límite, paginar el total, o empujar el filtro al SQL/RPC. Verificalo en cada flujo que busca o cuenta sobre un set.
- **Paginación SIEMPRE con desempate por columna única (`id`)**: ordenar solo por una columna no-única (ej. `fecha`) es no determinista entre filas con el mismo valor → la misma fila aparece al final de la página N y al inicio de la N+1 (**duplicado**) y otra se **saltea** (faltante). El último `order by` debe ser `id` (o clave única). Aplica a cadenas `.order()` y a `ORDER BY` en RPC.
- Subagentes: modelo capaz, salida estructurada, pipeline sobre barrier.
