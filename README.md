<div align="center">

# 📄 CV Formatter

**Editor de CV en línea - Crea, edita y comparte tu currículum profesional**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## ✨ Características

- 📝 **Editor intuitivo** - Edita tu CV en tiempo real con vista previa
- 🎨 **Temas claro/oscuro** - Interfaz adaptable a tus preferencias
- 📱 **Diseño responsive** - Funciona perfectamente en móviles y escritorio
- 📤 **Exportar a PDF** - Descarga tu CV listo para enviar
- 🔗 **Compartir enlace** - Comparte tu CV mediante un link único
- 💾 **Guardado automático** - Tus cambios se guardan automáticamente

---

## 🚀 Instalación

**Requisitos:** Node.js 18+

```bash
# Clonar el repositorio
git clone https://github.com/Facundo-Guarnier/cv-formatter.git
cd cv-formatter

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 🛠️ Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la build de producción |
| `npm run preview` | Previsualiza la build de producción |

---

## 🏗️ Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultra rápido
- **Tailwind CSS** - Framework de estilos
- **Supabase** - Backend y autenticación
- **Lucide React** - Iconografía

---

## 📁 Estructura del proyecto

```
cv-formatter/
├── components/
│   ├── cv/           # Componentes de vista previa del CV
│   ├── editor/       # Editores de cada sección
│   └── ui/           # Componentes reutilizables
├── hooks/            # Custom hooks
├── lib/              # Configuraciones (Supabase, etc.)
├── pages/            # Páginas de la aplicación
├── types/            # Tipos TypeScript
└── data/             # Datos mock para desarrollo
```

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

###  Agradecimientos

- [Google AI Studio](https://ai.studio/) - Por las herramientas de IA que facilitaron el desarrollo inicial
- [Lovable](https://lovable.dev/) - Por el plugin de devtools
