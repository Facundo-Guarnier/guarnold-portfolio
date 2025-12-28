# Instrucciones para GitHub Copilot - Guarnold Portfolio

## Contexto del Proyecto

Este es un Portafolio Personal profesional ("Guarnold") construido con React, TypeScript y Vite.

**Filosofía de Diseño:** "Material You" (Google Material Design 3). El sistema se basa en colores dinámicos generados a partir de una semilla, utilizando `@material/material-color-utilities`. La interfaz debe sentirse orgánica, con bordes redondeados, uso intensivo de `bg-surface`/`text-onSurface` y layouts tipo "Bento Grid".

**Estado Actual:** Transición de datos hardcodeados a datos dinámicos provenientes de **Supabase**.

**Importante:** El diseño es **Mobile-First**. Todo componente debe ser responsivo usando clases de Tailwind.

---

## Reglas OBLIGATORIAS (NO NEGOCIABLES)

### 0. Comunicación con el Usuario

**NUNCA** uses comandos de terminal para mostrar mensajes al usuario (como `Write-Host`, `echo`, etc.).

**SIEMPRE** comunica la información directamente en el chat.

**Razón:** Los mensajes en terminal generan ruido innecesario. La terminal es solo para ejecutar comandos que modifiquen el sistema.

**EXCEPCIÓN:** Al finalizar CADA respuesta, ejecutá el siguiente comando para llevar registro:

```powershell
echo "✅ Fin de la respuesta"
```

esto es con el objetivo de llevar un registro de cuándo finaliza cada respuesta generada.

---

### 1. Uso de MCP (Model Context Protocol) para Supabase

**REGLA CRÍTICA:** Para TODAS las operaciones con Supabase (migraciones, edge functions, logs, etc.), **SIEMPRE usar las herramientas MCP de Supabase**, NUNCA comandos de terminal.

#### **PROHIBIDO**

```powershell
# ❌ INCORRECTO - NO usar comandos de terminal para Supabase
npx supabase functions deploy get-shopify-discounts
supabase db push
supabase migration new
```

#### **OBLIGATORIO**

```typescript
// ✅ CORRECTO - Usar herramientas MCP de Supabase
mcp_supabase - tril_deploy_edge_function;
mcp_supabase - tril_apply_migration;
mcp_supabase - tril_get_logs;
mcp_supabase - tril_execute_sql;
```

**Razón:** Las herramientas MCP garantizan:

- Manejo correcto de credenciales
- Sincronización con el proyecto activo
- Logging y debugging apropiados
- Consistencia en el flujo de trabajo

**Herramientas MCP disponibles para Supabase:**

- `mcp_supabase-tril_apply_migration` - Aplicar migraciones SQL
- `mcp_supabase-tril_deploy_edge_function` - Desplegar edge functions
- `mcp_supabase-tril_execute_sql` - Ejecutar SQL directo
- `mcp_supabase-tril_get_logs` - Obtener logs (api, postgres, edge-function, etc.)
- `mcp_supabase-tril_list_migrations` - Listar migraciones
- `mcp_supabase-tril_list_tables` - Listar tablas
- `mcp_supabase-tril_get_advisors` - Obtener avisos de seguridad/performance

---

### 2. Estilos y Material Tailwind V3

**FILOSOFÍA DE ESTILOS:**
No uses colores hex arbitraios (ej. `#333` o `bg-blue-500`) a menos que sea estrictamente necesario para un hack visual (como el Navbar).

**REGLAS:**

1.  **Colores Semánticos:** Usa SIEMPRE las variables CSS configuradas en Tailwind:
    - `bg-background`, `bg-surface`, `bg-surface-variant`
    - `text-onBackground`, `text-onSurface`, `text-primary`
2.  **Componentes:** Usa los componentes de `@material-tailwind/react` (Card, Button, Chip) como base.
3.  **Clases Dinámicas:** Usa la utilidad `cn()` (clsx + tailwind-merge) para clases condicionales.

```tsx
// ❌ INCORRECTO - Colores hardcodeados
<div className="bg-gray-100 text-black p-4 rounded">...</div>

// ✅ CORRECTO - Variables del Sistema Material You
<div className={cn("bg-surface text-onSurface p-4 rounded-xl", className)}>...</div>
```

---

### 3. Componentes React - Reutilización

**FILOSOFÍA:** Los componentes deben ser agnósticos a los datos. Reciben `props` que coinciden con las interfaces de TypeScript de la DB.

#### **Patrones a seguir**

- **ProjectCard.tsx:** Debe aceptar una prop `project` que coincida con la definición de la tabla `projects`. Maneja estados como "Live", "WIP" automáticamente.
- **TimelineItem.tsx:** Debe ser genérico para mostrar tanto "Educación" como "Trabajo" basado en un campo `type`.
- **BentoGrid.tsx:** Debe iterar sobre una lista de proyectos y asignar clases de `row-span` o `col-span` basado en el campo `size` de la base de datos.

**NUNCA** hardcodees texto dentro de los componentes visuales. Pásalo como prop o extráelo de la DB.

---

### 4. Fetching de Datos (Supabase Integration)

**PATRÓN OBLIGATORIO:**

1.  Crea un hook personalizado o usa `useEffect` en las páginas (`Home.tsx`, `Trajectory.tsx`, `Projects.tsx`).
2.  Maneja los estados de **Loading** (con esqueletos/skeletons) y **Error** (con UI de fallback).
3.  No bloquees el renderizado inicial.

```tsx
// ✅ CORRECTO - Patrón de Fetching Básico
const [projects, setProjects] = useState<Project[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) setProjects(data);
    setLoading(false);
  };
  fetchProjects();
}, []);
```

---

### 5. Routing y Navegación

**Contexto:** Estamos usando `HashRouter` para compatibilidad con entornos de preview.

- Usa `<Link to="...">` para navegación interna.
- Usa `<a>` para enlaces externos (siempre con `target="_blank" rel="noopener noreferrer"`).
- El Navbar tiene lógica de scroll (`isScrolled`). Respétala al modificar el layout.

---

## Checklist de Desarrollo

Antes de dar una tarea por finalizada, verifica:

- [ ] **Data Fetching:** ¿La información viene de Supabase y no de un archivo JSON local?
- [ ] **Tipado:** ¿Las interfaces de TypeScript coinciden con las tablas de Supabase?
- [ ] **Theme:** ¿Se respetan los colores `primary`, `surface` y `background`?
- [ ] **Responsive:** ¿El grid/timeline se ve bien en móvil (columna única)?
- [ ] **Assets:** ¿Las imágenes tienen fallback (placeholder) si la URL de la DB falla?
- [ ] **Clean Code:** ¿Se eliminaron console.logs y código muerto?
