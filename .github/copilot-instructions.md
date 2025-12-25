# Instrucciones para GitHub Copilot - CV Formatter

## Contexto del Proyecto

Es una aplicación para editar CV en línea y poder descargarlo en formato PDF o compartirlo mediante un enlace. 

**Filosofía de Diseño:** "Minimalista, Lujoso y Oscuro", materializada a través de una interfaz moderna que evoca profesionalismo y alta gama.

**Importante:** El diseño es **Mobile-First**, garantizando una experiencia impecable en dispositivos móviles que escala de forma fluida a pantallas de escritorio.

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
mcp_supabase-tril_deploy_edge_function
mcp_supabase-tril_apply_migration
mcp_supabase-tril_get_logs
mcp_supabase-tril_execute_sql
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

### 2. Componentes React - Reutilización sobre Creación

**FILOSOFÍA FUNDAMENTAL:**

Los componentes en React son **reutilizables y genéricos**. Antes de crear un nuevo componente:

**SIEMPRE** pregúntate:
- ¿Existe un componente similar que pueda ser reutilizado cambiando solo los datos o props?
- ¿Puedo extraer la lógica común a un componente padre?
- ¿Estoy siguiendo la estructura Mobile-First?

#### **Reutilización de Secciones**

```jsx
// ❌ INCORRECTO - Crear una sección específica para cada colección
<RelojesdePorHombreSection />
<PerfumesParaMujerSection />
<LentesDeportivosSection />

// ✅ CORRECTO - Usar una sección genérica reutilizable
<ProductCollectionGrid 
  collectionHandle="relojes-hombre"
  title="Relojes para Hombre"
/>

<ProductCollectionGrid 
  collectionHandle="perfumes-mujer"
  title="Perfumes para Mujer"
/>

<ProductCollectionGrid 
  collectionHandle="lentes-deportivos"
  title="Lentes Deportivos"
/>
```

#### **Nomenclatura de Componentes**

- Componentes personalizados: PascalCase sin sufijo especial (ej. `ProductCard`, `HeaderNav`)
- Componentes de utilidad: Preferir importar de Shadcn (ej. `Button`, `Dialog`)

---

---

### 3. Diseño Mobile-First y Responsive

**OBLIGATORIO:** Todos los componentes deben funcionar perfectamente en dispositivos móviles y escalar a pantallas de escritorio.

```jsx
// ✅ CORRECTO - Diseño Mobile-First
<div className="w-full px-4 sm:px-6 lg:px-8">
  <div className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-6xl mx-auto">
    {/* Contenido responsive */}
  </div>
</div>

// Usar Tailwind CSS breakpoints: sm, md, lg, xl
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {products.map(product => <ProductCard key={product.id} {...product} />)}
</div>
```

---

### 4. Feedback al Usuario y Manejo de Errores

**OBLIGATORIO:** Proporcionar feedback claro en acciones clave.

```jsx
// ✅ CORRECTO - Feedback al usuario
const [message, setMessage] = useState(null);
const [loading, setLoading] = useState(false);

const addToCart = async (productId) => {
  setLoading(true);
  try {
    await fetch('/api/cart/add', { method: 'POST', body: JSON.stringify({ productId }) });
    setMessage('✅ Producto añadido al carrito');
  } catch (error) {
    setMessage(`❌ Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

**Páginas de Error:** Diseñar páginas de error consistentes con la marca (ej. 404, 500).


---

## Checklist de Desarrollo

Cuando crees nuevas funcionalidades, asegúrate de:

- [ ] **NO hay contenido de productos hardcodeado** (todo viene de Shopify)
- [ ] Los componentes son **reutilizables** (ej. ProductGrid se usa en múltiples páginas)
- [ ] El diseño es **Mobile-First** y responsive
- [ ] Hay **feedback claro al usuario** en acciones clave
- [ ] Se sigue la **paleta de colores** de la marca
- [ ] Las **migraciones SQL** (si aplica) siguen el formato `<timestamp>_name.sql`
- [ ] El código está **bien documentado** con comentarios donde sea necesario
- [ ] Se manejan **errores gracefully** con mensajes claros

