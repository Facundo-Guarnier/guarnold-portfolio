# Configuración del MCP de Supabase

## Setup rápido

1. **Configurar variables en `.env`:**

```env
SUPABASE_PROJECT_ID="tu-project-id"
SUPABASE_ACCESS_TOKEN="sbp_tu_token"  # Obtener en: supabase.com/dashboard/account/tokens
MCP_PROJECT_DIR="D:\Repositorios_GitHub\guarnold-portfolio\.vscode"
```

2. **Agregar al `mcp.json` del sistema:**

Ubicación:

`C:\Users\TU_USUARIO\.cursor\mcp.json`
`C:\Users\facun\AppData\Roaming\Code\User\mcp.json`

```jsonc
{
  "mcpServers": {
    ...
    "supabase-guarnold-portfolio": {
      "command": "node",
      "args": [
        "d:\\Repositorios_GitHub\\guarnold-portfolio\\.vscode\\supabase-mcp-wrapper.cjs"
      ],
      "cwd": "d:\\Repositorios_GitHub\\guarnold-portfolio",
      "disabled": false
    }
    ...
  }
}
```

⚠️ **Importante:** Usar rutas absolutas con `\\` en Windows.

3. **Listo.** Reinicia Cursor y el MCP estará disponible.
