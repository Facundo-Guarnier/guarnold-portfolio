# Instrucciones para GitHub Copilot - Trilex Store

## Contexto del Proyecto

Estás trabajando en **Trilex Store**, una tienda online premium para la venta de relojes de lujo, diseñada con una arquitectura de contenido preparada para escalar a futuras categorías como perfumes y lentes.

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

### 2. Arquitectura de Datos - Shopify es la Fuente Única de la Verdad

**REGLA FUNDAMENTAL:** Shopify **define la estructura completa del catálogo** (Productos, Colecciones, Precios, Inventario y Contenido). El frontend (Lovable) es una **capa de presentación "tonta"** que solicita y renderiza dinámicamente.

#### **PROHIBIDO (Hardcoding)**

```jsx
// ❌ INCORRECTO - NO hardcodear productos, precios o descripciones
const products = [
  { id: 1, name: "Reloj Suizo", price: "$5,000", image: "..." },
  { id: 2, name: "Reloj Deportivo", price: "$3,000", image: "..." }
];

<Product name="Reloj Suizo" price="$5,000" />
```

#### **OBLIGATORIO (Dinámico desde Shopify)**

```jsx
// ✅ CORRECTO - Obtener datos dinámicamente desde Shopify
const { products } = await fetchProductsFromShopify();

products.map(product => (
  <Product 
    key={product.id}
    name={product.title}
    price={product.priceRange.minVariantPrice.amount}
    image={product.featuredImage.src}
    description={product.description}
  />
))
```

#### **Regla de Escalabilidad: Estructura Genérica en Shopify**

Para garantizar la expansión a nuevas categorías (Perfumes, Lentes), la estructura de datos debe ser **genérica y reutilizable**:

| Elemento | Estrategia | Ejemplo |
|----------|-----------|---------|
| **Tipo de Producto** | Campo obligatorio en Shopify | `Reloj`, `Perfume`, `Lentes` |
| **Atributos Transversales** | Etiquetas (Tags) | `genero:hombre`, `estilo:deportivo`, `marca:rolex` |
| **Detalles Técnicos Específicos** | Metafields (Custom Fields) | `resistencia_agua` para relojes, `volumen_ml` para perfumes |

```
// ❌ INCORRECTO - Crear una colección hardcodeada
Colección: "Relojes de Hombre Deportivos" (no escala)

// ✅ CORRECTO - Usar estructura genérica
1. Producto con Tipo = "Reloj"
2. Etiquetas = ["genero:hombre", "estilo:deportivo"]
3. Metafields = { resistencia_agua: "100m" }
→ Permite crear colecciones automáticas y filtros dinámicos
```

---

### 2. Convención de Nombres para Migraciones SQL (Cuando se integre Supabase)

**Formato:** `<timestamp>_<name>.sql`

- **timestamp:** 14 dígitos UTC (`YYYYMMDDHHMMSS`)
- **name:** En `snake_case`, descriptivo y corto
- **Encabezado:** `-- migration: <timestamp>_<name>.sql`

**Ejemplo:**

```sql
-- migration: 20251112143000_create_customers_table.sql

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3. Componentes React - Reutilización sobre Creación

**FILOSOFÍA FUNDAMENTAL:**

Los componentes en Lovable/React son **reutilizables y genéricos**. Antes de crear un nuevo componente:

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

### 4. Gestión de Estado

#### **Estado del Servidor (Datos de Shopify)**

**OBLIGATORIO:** Usar un cliente HTTP o SDK de Shopify para fetching de datos.

```jsx
// ✅ CORRECTO - Usar Fetch API o Shopify SDK
const fetchProducts = async () => {
  const response = await fetch('/api/shopify/products');
  const data = await response.json();
  return data;
};

// En componentes, usar estados locales o librerías como SWR / React Query
const { data: products, isLoading } = useFetch(fetchProducts);
```

#### **Estado del Cliente (UI State)**

Para estado local de UI que **NO persiste en el backend** (ej. modal abierto/cerrado, filtros aplicados, notificaciones):

```jsx
// ✅ CORRECTO - Usar useState para estado local
const [isFilterOpen, setIsFilterOpen] = useState(false);
const [selectedFilters, setSelectedFilters] = useState({});

// Para estado global, considerar Context API o Zustand si es complejo
```

---

### 5. Diseño Mobile-First y Responsive

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

### 6. Feedback al Usuario y Manejo de Errores

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

### 7. Paleta de Colores y Sistema de Diseño

**IMPORTANTE:** Seguir la paleta "Minimalista, Lujoso y Oscuro" definida en el proyecto.

```jsx
// ✅ CORRECTO - Usar nombres de color semánticos
<button className="bg-primary text-primary-foreground hover:bg-primary-dark">
  Comprar Ahora
</button>

// ❌ INCORRECTO - NO hardcodear colores
<button className="bg-blue-500 text-white">Comprar Ahora</button>
```

Consuta los archivos de configuración (Tailwind, CSS variables) para los colores exactos.

---

### 8. Sistema de Autorización y Roles

### Roles en v1.0

1. **Administrador de la Tienda**: Acceso total al panel de Shopify para gestionar productos, colecciones, pedidos, clientes y contenido.
2. **Cliente**: Usuario final que navega y compra. **No requiere registro para comprar** (carrito de sesión).

```jsx
// ✅ CORRECTO - Renderizado condicional por roles (cuando sea necesario)
{isAdmin && <AdminDashboard />}

// No se requiere autenticación para compra básica
```

---

### 9. Estructura de Archivos

```
src/
├── components/           # Componentes reutilizables
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── Header.tsx
│   ├── CartSidebar.tsx
│   ├── Footer.tsx
│   └── ui/              # Componentes base (Shadcn)
├── pages/                # Páginas principales
│   ├── Index.tsx
│   ├── ProductPage.tsx
│   ├── CollectionPage.tsx
│   ├── AboutPage.tsx
│   ├── CartPage.tsx
│   └── NotFound.tsx
├── hooks/                # Custom hooks
│   ├── use-cart.tsx
│   └── use-mobile.tsx
├── integrations/         # Integraciones con servicios externos
│   ├── shopify/
│   │   └── client.ts     # Cliente de Shopify
│   └── supabase/         # (Futuro)
├── lib/                  # Utilidades
│   └── utils.ts
├── styles/               # Estilos globales
│   └── index.css
└── assets/               # Imágenes y recursos estáticos

supabase/
├── config.toml
└── migrations/           # (Cuando se integre)
    └── 20251112143000_initial_schema.sql
```

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

---

## Ejemplos de Código

### Crear una página de colección dinámica

```tsx
// pages/CollectionPage.tsx
import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/ProductGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function CollectionPage({ params }) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await fetch(
          `/api/shopify/collections/${params.handle}`
        );
        const data = await response.json();
        setCollection(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [params.handle]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-12">Error: {error}</div>;
  if (!collection) return <div className="text-center py-12">No encontrado</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-foreground">
          {collection.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          {collection.description}
        </p>
        
        <ProductGrid products={collection.products} />
      </div>
    </div>
  );
}
```

### Componente ProductGrid reutilizable

```tsx
// components/ProductGrid.tsx
interface ProductGridProps {
  products: any[];
  columns?: number;
}

export function ProductGrid({ 
  products, 
  columns = 3 
}: ProductGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## Notas Finales

- **Shopify First:** Todo el contenido viene de Shopify, no del código
- **Mobile-First:** Prioriza la experiencia en dispositivos móviles
- **Reutilización:** Favorece componentes genéricos sobre específicos
- **Escalabilidad:** Usa estructura genérica de Shopify para futuras categorías
- **Consistencia:** Mantén la paleta de colores y diseño a través de toda la tienda
- **Seguridad:** Shopify maneja pagos y seguridad de transacciones

**Cuando tengas dudas, sigue estas instrucciones. Son la guía definitiva del proyecto.**
