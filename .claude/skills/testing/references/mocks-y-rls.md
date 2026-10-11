# Mocks de Supabase, AuthContext y RLS

## Mock de Supabase: patrón obligatorio (ESM)

`vi.mock()` se hoistea antes de las declaraciones `const`. Sin `vi.hoisted()` las variables quedan en la
zona muerta temporal y el test falla con `ReferenceError`. Por eso el mock se define así:

```ts
const { mockGetSession, mockSchema, mockFrom, chain } = vi.hoisted(() => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    upsert: vi.fn().mockReturnThis(),
  }
  const mockFrom = vi.fn().mockReturnValue(chain)
  const mockSchema = vi.fn().mockReturnValue({ from: mockFrom })
  const mockGetSession = vi.fn()
  return { mockGetSession, mockSchema, mockFrom, chain }
})

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    schema: mockSchema,
  },
}))

// Importar DESPUÉS de vi.mock()
import { useMyHook } from '@/hooks/useMyHook'
```

Re-enganche en `beforeEach`, después de `vi.clearAllMocks()`, porque `clearAllMocks` borra las
implementaciones:

```ts
beforeEach(() => {
  vi.clearAllMocks()
  mockSchema.mockReturnValue({ from: mockFrom })
  mockFrom.mockReturnValue(chain)
})
```

El objetivo del mock es comprobar cómo el componente **reacciona**, no que Supabase funcione. Camino
bueno: `{ data, error: null }`. Camino malo: `{ data: null, error }`.

## Helpers de respuesta

```ts
// tests/mocks/handlers.ts
export const mockSuccess = <T>(data: T) => ({ data, error: null })
export const mockError = (message: string) => ({ data: null, error: { message } })
export const mockList = <T>(items: T[]) => ({ data: items, error: null })
```

## Mock de AuthContext (gating por rol)

```ts
const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mockUseAuth() }))
```

Un test por rol relevante. Los roles del proyecto se pasan como objeto (ejemplo:
`{ isSuperadmin, isInternal, internalUser, carrier }`).

## Fechas

La lógica de fechas usa `src/lib/utils.ts`. En el test, fijar `vi.setSystemTime(new Date('2026-05-29'))`
en `beforeEach` y llamar `vi.useRealTimers()` en `afterEach`.

## Prerrequisitos de los tests RLS

1. Docker Desktop corriendo.
2. `npx supabase start` (solo Docker local; nunca contra la nube).
3. Obtener la anon key local: `npx supabase status --output json` → campo `ANON_KEY`.
4. Correr: `VITE_SUPABASE_ANON_KEY=<key> npx vitest run tests/rls/`.

Usar valores de enum válidos. Ejemplo: `tasks.status` acepta `"planning" | "todo" | "doing" | "qa" | "done"`.
Nunca `"pending"`.

En CI, los tests RLS y E2E corren solo en PR hacia `main`. El orden es: unit e integración
(`npx vitest run`), luego RLS (`tests/rls/`), luego E2E (`npx playwright test`).
