# Configuración del MCP de Supabase

## Setup rápido

1. **Configurar variables en `.env`:**

```env
SUPABASE_PROJECT_ID="tu-project-id"
SUPABASE_ACCESS_TOKEN="sbp_tu_token"  # Obtener en: supabase.com/dashboard/account/tokens
MCP_PROJECT_DIR="D:\Repositorios_GitHub\guarnold-portfolio\.vscode"
```

2. **Agregar al `mcp.json` del sistema:**

Ubicación para hacerlo a nivel sistema (no en el proyecto):

`C:\Users\<TU_USUARIO>\AppData\Roaming\Code\User\mcp.json`

Ubicación para hacerlo a nivel proyecto (en el proyecto):

`.vscode/mcp.json`

```jsonc
{
  "servers": {
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

3. **Listo.** Reinicia y el MCP estará disponible.
