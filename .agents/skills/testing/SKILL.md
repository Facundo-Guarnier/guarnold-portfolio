---
name: testing
description: "Escribe, modifica, revisa o planifica tests en proyectos React + Supabase (unit, integración, RLS y E2E), y genera tests desde una tarea de GuarNote (criterios de aceptación e invariantes §V) o desde un archivo de código. Usala antes de implementar algo testeable, al corregir un bug que necesita test de regresión, o cuando el usuario mencione test, vitest, playwright, mock, cobertura o RLS. NO usarla para diagnosticar fallos de CI o de pre-commit (eso es pr-fix o precommit-fix) ni para auditorías de seguridad (eso es cavekit-audit)."
---

# testing

Stack: **Vitest + React Testing Library + jsdom** (unit e integración), **Playwright** (E2E) y
**Supabase local en Docker** (RLS). Los detalles de mocks, RLS y la generación desde tareas están en
`references/`.

## Niveles

| Nivel | Supabase | Cuándo corre |
|---|---|---|
| Unit | `vi.mock` | siempre |
| Integración | `vi.mock` | siempre |
| RLS | Supabase local real | solo en PR hacia `main` |
| E2E | local o staging | solo en PR hacia `main` |

## Reglas

- Los tests van en `tests/` (estructura centralizada), no junto al código de `src/`.
- Nombre de archivo `*.test.ts` o `*.test.tsx`. Nunca `.spec.ts`.
- Se prueba comportamiento observable, nunca implementación interna.
- Prohibido `getByTestId`, salvo excepción justificada en un comentario.
- Cada test es independiente: no depende del orden de ejecución.
- Sin `console.log` en tests.
- Cada `it()` cita su origen en un comentario: `// §A: <criterio>`, `// §V: V<n>` o `// branch: <desc>`.
  Un test que no cita origen no se escribe.
- El nombre del test dice qué comportamiento se verifica y bajo qué condición, sin nombrar la función
  llamada. Convención por repo: `should_when`, `Given_When_Then` o `Method_State_Expected`, una sola.
- El mock de Supabase se resetea en `beforeEach`.
- Módulos ESM: `require()` dentro de tests está prohibido. Ver el patrón con `vi.hoisted()` en
  `references/mocks-y-rls.md`.

### Anti-trivialidad

Un test que pasa con la lógica rota es malo. Si borrar la línea bajo prueba no hace fallar el test, el
test no sirve.

Prohibido:

- `expect(true).toBe(true)` y cualquier tautología;
- tests de setter (`setX('a'); expect(x).toBe('a')`);
- probar librerías de terceros (el router navega, Radix abre, zod valida);
- mockear la unidad bajo test (el test verifica el mock);
- snapshot de markup sin aserción semántica;
- reimplementar la lógica en el test y comparar contra sí misma.

Obligatorio:

- un camino bueno con dominio real (entrada válida, salida correcta);
- al menos un camino malo por unidad con ramas de error: entrada inválida, permiso denegado, error de
  red, estado vacío;
- un test por cada rama propia (`if`, `switch`, ternario) de gating de rol, validación o mapeo;
- bordes: lista vacía, cero documentos, fecha de hoy, rol nulo, umbral exacto.

## Invariantes

- **V1** Todo hook que llama a Supabase tiene test de camino de error.
- **V2** Todo flujo de auth tiene test de sesión nula o expirada.
- **V3** Toda tabla con datos de usuario tiene test RLS de aislamiento entre usuarios.
- **V4** Ningún test depende del orden de ejecución de otros.
- **V5** El mock de Supabase se resetea en `beforeEach`.
- **V6** Los inserts en tests RLS usan valores de enum válidos según el schema real.

## Procedimiento

1. Identificar la fuente: una tarea `#AAAA-XXXX` de GuarNote (`get_task`; genera desde sus criterios
   de aceptación y su §V), o un archivo `src/...` (genera desde la lógica propia). Si no hay ninguna, preguntar al usuario antes de escribir.
2. Para tareas: mapear cada criterio de aceptación a un archivo real. Lo que no sea testeable en unit (por ejemplo
   "RLS impide X") va a integración o SQL y se anota como fuera de alcance; no se fuerza en unit.
3. Para código: testear solo lógica propia con ramas. Ignorar JSX de presentación, re-exports y wrappers
   triviales. Si una lógica privada con ramas no se puede probar, extraerla a un módulo puro, avisando
   antes al usuario.
4. Correr `npx vitest run <archivo>`. Si falla por un test mal escrito, corregir el test. Si falla
   porque hay un bug real, **no maquillar el test**: reportarlo como candidato a los errores de la
   tarea y pasar a `cavekit-backprop`.
5. Mutación opcional: romper una rama a mano y confirmar que el test falla.

## Verificación antes de cerrar

- `npx vitest run` sale con código 0.
- Ningún `it()` sin cita de origen.
- Ningún patrón prohibido.
- Al menos un camino malo por unidad con ramas de error.

## Fuera de alcance

- Testear RLS en unit: el unit sobre `can()` es un espejo de la UX, no la frontera. RLS va a integración
  contra Supabase local.
- Bugs que solo aparecen con el click (hover, focus, overlay, `pointer-events`): jsdom no tiene layout.
  Van al arnés de navegador (`docs/guides/browser-exploration-harness.md`).
- Perseguir 100 % de cobertura. Se persiguen tests que fallan si la lógica se rompe.
- Editar código bajo prueba "para hacerlo testeable" sin avisar.
- Crear IDs de tarea.

## Referencias

- `references/mocks-y-rls.md`: patrón de mock de Supabase con `vi.hoisted()`, mock de AuthContext,
  helpers de respuesta y prerrequisitos de los tests RLS.
- `references/desde-tarea-y-codigo.md`: formato del reporte final y ejemplos de cómo mapear §A a tests.
