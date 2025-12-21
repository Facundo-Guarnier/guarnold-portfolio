### **Knowledge Base para "Trilex Store": E-commerce de Lujo (v1.0)**

#### **1. Visión General del Proyecto**

- **Nombre del Proyecto:** Trilex Store.
- **Propósito:** Construir una tienda online premium para la venta de relojes, con una arquitectura de contenido y diseño preparada para escalar a futuras categorías como perfumes y lentes.
- **Diseño:** La interfaz debe seguir un enfoque **Mobile-First**, garantizando una experiencia de usuario impecable en dispositivos móviles que escala de forma fluida a escritorio. El estilo será **Minimalista, Lujoso y Oscuro**, utilizando la paleta de colores definida para evocar una sensación de alta gama y profesionalismo.

#### **2. Arquitectura de Contenido y Datos (Shopify-Driven)**

- **Filosofía:** La capa visual (Lovable) es una capa de presentación. **NO debe contener lógica de negocio ni contenido de productos (precios, stock, descripciones) hardcodeado.**
- **Fuente Única de la Verdad:** **Shopify es el cerebro y la única fuente de la verdad.** Define la estructura completa del catálogo: Productos, Colecciones (categorías), Precios, Inventario y Contenido de páginas. Lovable solicita y renderiza esta estructura dinámicamente.
- **Regla de Escalabilidad (Componentes Genéricos):** Para garantizar la futura expansión a nuevas categorías de productos, la estructura de datos en Shopify debe ser genérica y reutilizable.
  - **Tipos de Producto:** Usar rigurosamente el campo "Tipo de producto" (`Reloj`, `Perfume`, `Lentes`).
  - **Etiquetas (Tags):** Usar etiquetas para atributos transversales y filtrables (`genero:hombre`, `estilo:deportivo`, `marca:x`).
  - **Datos Personalizados (Metafields):** Usar metafields para almacenar detalles técnicos específicos de cada tipo de producto (`Resistencia al Agua` para relojes, `Volumen (ml)` para perfumes). Esto permite que una única plantilla de producto en Lovable pueda mostrar detalles diferentes según el tipo de producto.

#### **3. Stack Técnico**

- **Backend & E-commerce Engine:** **Shopify Storefront API** (Headless Commerce).
- **Frontend:** **React 18 + Vite** (SPA).
- **UI Framework:** **Tailwind CSS + Shadcn/ui**.
- **Estado:** **Zustand** (Carrito/UI) + **TanStack Query** (Server State).
- **Backend Logic:** **Supabase Edge Functions** (Deno).
- **Media:** **yet-another-react-lightbox** (Galerías fullscreen) + **Embla Carousel** (Sliders).
- **SEO:** **react-helmet-async**.

#### **4. Convenciones y Reglas Técnicas (NO NEGOCIABLE)**

##### **4.1. Migraciones de Supabase**

- _Nota: Estas reglas se aplicarán cuando se inicie la integración con Supabase._
- **Formato de Nombre:** `<timestamp>_name.sql` (timestamp UTC de 14 dígitos: `YYYYMMDDHHMMSS`).
- **Encabezado de Archivo:** Cada archivo de migración DEBE iniciar con el comentario: `-- migration: <timestamp>__<name>.sql`.

##### **4.2. Estructura de Datos en Shopify (Shopify Service)**

- **Abstracción Obligatoria:** **Ningún componente o sección en Lovable debe contener texto, precios o imágenes "hardcodeadas" que pertenezcan a un producto.** Toda la información del catálogo debe obtenerse dinámicamente desde Shopify. El contenido estático (ej. "Sobre Nosotros") se gestionará desde las "Páginas" de Shopify.
- **Manejo de Datos Idiomático:** La estructura de datos debe seguir las mejores prácticas de Shopify para ser escalable.

  ```
  // ❌ INCORRECTO: Crear una colección en Shopify llamada "Relojes de Hombre Deportivos". Es demasiado específica y no escala.

  // ✅ CORRECTO:
  // 1. Crear un producto.
  // 2. Asignarle `Tipo de Producto = Reloj`.
  // 3. Añadirle `Etiquetas = genero:hombre, estilo:deportivo`.
  // Esto permite crear colecciones automáticas y filtros dinámicos en el futuro.
  ```

#### **5. Sistema de Diseño y Componentes de UI**

**La Documentación Viva: Secciones y Componentes Reutilizables en Lovable**
_ **Propósito:** Una vez que el proyecto esté en marcha, el propio editor de Lovable se convertirá en el **catálogo de componentes y secciones reutilizables** ya construidos.
_ **INSTRUCCIÓN DE PATRONES PARA LA IA:** Antes de crear una nueva sección (ej. "Nuevos Productos"), revisa si ya existe una sección genérica (ej. "Cuadrícula de Colección") que pueda ser reutilizada simplemente cambiando su fuente de datos (apuntando a otra colección de Shopify). **Favorece la reutilización sobre la creación.**

#### **6. Feedback al Usuario y Manejo de Errores**

- **Feedback de Interacción:** Lovable debe ser configurado para dar feedback claro al usuario en acciones clave (ej. un mensaje o animación cuando un producto se añade al carrito).
- **Páginas de Error:** Se deben diseñar páginas de error consistentes con la marca para los casos comunes, como **Error 404 (Página no encontrada)**.
- **Errores de Transacción:** El motor de Shopify gestiona los errores de pago, garantizando un proceso seguro y robusto.

#### **7. Autorización y Roles**

- **Roles en v1.0 (Shopify):**
  1.  **`Administrador de la Tienda`**: Rol con acceso total al panel de Shopify para gestionar productos, colecciones, pedidos, clientes y contenido de la web.
  2.  **`Cliente`**: Usuario final que navega y compra en la tienda. No requiere registro para comprar.
