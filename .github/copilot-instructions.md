# Instrucciones para GitHub Copilot - Guarnold CV System

## Contexto del Proyecto

Estás trabajando en **Guarnold CV System**, una aplicación web profesional para la gestión, edición y visualización de Curriculum Vitae (CV) y Portafolios.

**Stack Tecnológico:** React, Vite, Tailwind CSS, TypeScript y **Supabase** (Base de Datos & Auth).

**Filosofía de Diseño:**
1.  **Vista Pública:** "Minimalista, Impreso-Perfecto (A4), Profesional".
2.  **Vista Admin:** "Funcional, Rápida, Dark-Mode Friendly".

**Importante:** El proyecto tiene una dualidad crítica: debe verse excelente en pantalla (Responsive/Dark Mode) pero **SIEMPRE** debe imprimirse en papel blanco A4 perfecto (Print-First).

---

## Reglas OBLIGATORIAS (NO NEGOCIABLES)

### 0. Comunicación con el Usuario

**NUNCA** uses comandos de terminal para mostrar mensajes al usuario (como `console.log` innecesarios en producción).

**SIEMPRE** comunica la información directamente en el chat o mediante comentarios en el código.

**EXCEPCIÓN:** Al finalizar CADA respuesta compleja, puedes sugerir el comando de verificación pertinente.

---

### 1. Interacción con Supabase (Backend & Tipos)

**REGLA CRÍTICA:** Supabase es la fuente de verdad. No usaremos más `localStorage` como fuente principal.

#### **PROHIBIDO (Tipado Débil)**

```typescript
// ❌ INCORRECTO - Usar 'any' o tipos manuales no sincronizados
const { data } = await supabase.from('experience').select('*');
// data es 'any'
```

#### **OBLIGATORIO (Tipado Fuerte)**

```typescript
// ✅ CORRECTO - Usar los tipos generados automáticamente
import { Database } from '@/types/supabase';
const { data } = await supabase
  .from('experience')
  .select('*')
  .returns<Database['public']['Tables']['experience']['Row'][]>();
```

**Reglas de Seguridad (RLS):**
- **Lectura (SELECT):** Permitida para `anon` (público) en tablas de perfil/cv.
- **Escritura (INSERT/UPDATE/DELETE):** Estrictamente restringida a usuarios autenticados (Admin).

---

### 2. Arquitectura de Datos - Supabase define el Contenido

**REGLA FUNDAMENTAL:** El esquema de la base de datos define la estructura. El frontend es un renderizador.

#### **Estructura de Tablas Esperada:**
- `profile`: Datos únicos (nombre, título, bio, foto).
- `contact_info`: Redes sociales y métodos de contacto (array o tabla relacionada).
- `experiences`: Historial laboral (ordenables).
- `education`: Historial académico.
- `skills`: Habilidades con nivel (0-5).
- `projects`: Proyectos destacados (full width support).

#### **Manejo de "Mock Data" vs "Real Data":**
Si el cliente de Supabase falla o no hay conexión, la app debe fallar o mostrar error, **NO** hacer fallback silencioso a datos de ejemplo falsos en producción.

---

### 3. Migraciones SQL y Cambios en DB

**Formato:** `<timestamp>_<name>.sql`

- **timestamp:** 14 dígitos UTC (`YYYYMMDDHHMMSS`)
- **name:** En `snake_case`, descriptivo.

**Ejemplo:**

```sql
-- migration: 20251221143000_create_projects_table.sql

create table public.projects (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  tech_stack text[],
  display_order integer default 0,
  created_at timestamp with time zone default now(),
  constraint projects_pkey primary key (id)
);

-- Habilitar RLS
alter table public.projects enable row level security;
```

---

### 4. Componentes React - Separación de Intereses

**FILOSOFÍA FUNDAMENTAL:** Separar claramente los componentes de **Edición** de los componentes de **Visualización (Papel)**.

#### **Patrón de Visualización (Print-First)**

```jsx
// ✅ CORRECTO - Componente de Vista (A4)
// Debe soportar clases 'print:' para asegurar salida en blanco y negro
export const ExperienceItem = ({ data }) => (
  <div className="break-inside-avoid mb-4 print:text-black dark:text-gray-200">
    <h3 className="font-bold text-gray-900 dark:text-white print:text-black">
      {data.role}
    </h3>
    {/* ... */}
  </div>
);
```

#### **Patrón de Edición (Admin)**

```jsx
// ✅ CORRECTO - Componente de Edición
// Debe usar react-hook-form y actualizar el estado global/Supabase
export const ExperienceForm = ({ defaultValues, onSave }) => (
  <form className="bg-white dark:bg-gray-800 p-4 rounded shadow">
    <Input label="Empresa" {...register('company')} />
    {/* ... */}
  </form>
);
```

---

### 5. Gestión de Estado y Tema

#### **Persistencia Dual (Theme)**

**OBLIGATORIO:**
1.  **Vista Pública:** El tema (Dark/Light/Accent) se guarda en `sessionStorage`. No afecta al Admin.
2.  **Vista Admin:** El tema se guarda en la Base de Datos (`profile.settings`) y es la configuración "oficial" del sitio.

#### **Regla de Impresión (PDF)**

Sin importar el tema seleccionado en pantalla (Dark Mode, Matrix Green, etc.), la impresión **SIEMPRE** debe forzar:
- Fondo Blanco (`print:bg-white`)
- Texto Negro (`print:text-black`)
- Sin sombras ni fondos decorativos.

---

### 6. Diseño Responsive & Mobile

**OBLIGATORIO:**
- **Admin:** Debe ser usable en móvil (Mobile-First) para ediciones rápidas.
- **Vista CV:** En móvil se adapta al ancho (`w-full`), pero en escritorio e impresión respeta el formato A4 (`max-w-[210mm]`).

---

### 7. Sistema de Autorización y Roles

### Roles

1.  **Owner (Admin):** Usuario autenticado vía Supabase Auth. Puede editar, reordenar y borrar.
2.  **Viewer (Público):** Cualquier visitante. Solo lectura. Puede descargar PDF.

```jsx
// ✅ CORRECTO - Protección de rutas
<Route element={<ProtectedRoute />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>
```


---

## Checklist de Desarrollo

Cuando implementes nuevas features:

- [ ] **NO hay datos hardcodeados** (todo viene de Supabase).
- [ ] **RLS** está configurado en cada nueva tabla creada.
- [ ] El **Modo Oscuro** funciona en pantalla pero se anula al imprimir.
- [ ] Los saltos de página en PDF usan `break-inside-avoid`.
- [ ] Los formularios de edición tienen validación básica.
- [ ] Se usa el cliente de Supabase tipado.

---

## Notas Finales

- **Supabase First:** Si no está en la DB, no existe.
- **Print-Safe:** Siempre prueba que el CSS tenga su contraparte `print:`.
- **Clean Code:** Mantén los componentes de UI (Shadcn/Tailwind) separados de la lógica de negocio.

**Cuando tengas dudas sobre implementación de Backend, prioriza la documentación oficial de Supabase v2.**
