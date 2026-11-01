# Trabajo con varios agentes

Criterio para decidir cuándo usar subagentes, con qué modelo y cómo delegarles. Las definiciones
están en `.claude/agents/` (`relevador`, `implementador`, `verificador`, `revisor`).

Fuentes: [Anthropic, sistema multiagente de investigación](https://www.anthropic.com/engineering/multi-agent-research-system)
(patrón orquestador-trabajador: el líder planifica y lanza trabajadores con contexto limpio; costo cercano a
15 veces el de un chat) y [documentación de subagentes de Claude Code](https://code.claude.com/docs/en/sub-agents).
La receta "Opus planifica, Haiku ejecuta" no está en la fuente oficial: es una práctica que funcionó en el
hub, y se trata como tal.

## 1. Cuándo sí usar subagentes

- Tareas **amplias y paralelizables**: relevar un repo, investigar varias opciones, buscar en muchos archivos.
- **Verificar** algo ya hecho (correr tests, typecheck, leer un diff y reportar).
- Aplicar **el mismo cambio mecánico** en N repos o N archivos, con una especificación cerrada.
- Cuando la salida es un resumen corto y el contenido intermedio no hace falta en el contexto principal.

## 2. Cuándo no

- **Diseño** y decisiones que dependen de mucho contexto compartido. Un subagente arranca sin esa
  historia y produce una versión plausible pero desalineada.
- Cambios con dependencias fuertes entre archivos, donde cada paso depende del anterior.
- Tareas chicas (un texto, un fix puntual). Anthropic: "para cambios de una frase, saltear el plan".

Regla práctica: el líder (el hilo principal) conserva el diseño y la integración; los trabajadores leen,
buscan, verifican o aplican cambios acotados.

## 3. Modelo por tipo de tarea

| Tarea | Modelo | Por qué |
|---|---|---|
| Plan, diseño, decisiones de arquitectura | Opus | Requiere juicio sobre el conjunto |
| Revisión de diffs y de planes | Opus (o `revisor` en contexto fresco) | Detectar lo que el autor no vio |
| Relevar, buscar, leer y resumir | Haiku (`relevador`) | Barato, lectura pura |
| Verificar: tests, typecheck, build, lint (`verificador`) | Haiku | Ejecuta y reporta; no decide |
| Cambios mecánicos con especificación cerrada (`implementador`) | Haiku | El trabajo intelectual ya está hecho en la spec |
| Auditoría de seguridad y de flujos | Sonnet u Opus | Razonamiento sobre permisos y casos límite; lo pide `multilayer-flow-verification` |

Los agentes de verificación que buscan huecos o contradicciones **consumen muchos tokens y se pregunta
al owner antes de lanzarlos** (ver `docs/reglas-de-trabajo.md` §5).

## 4. Cómo delegar

Cada delegación lleva, como mínimo:

1. **Objetivo**: qué se quiere como resultado, en una frase.
2. **Archivos permitidos**: la lista exacta. Lo que no está en la lista no se toca.
3. **Prohibiciones**: `git add -A`, `git add .`, `git push`, tocar producción, `--no-verify`, y lo que
   corresponda al caso (por ejemplo, no tocar migraciones aplicadas).
4. **Verificación**: qué comando debe correr y qué salida se espera.
5. **Formato de reporte**: el de la sección 5.

Una delegación vaga produce trabajo duplicado o trabajo sobre lo que no era.

## 5. Formato estándar de reporte

Todo subagente termina con este reporte, en este orden:

- **Archivos cambiados**: ruta por ruta, con una línea de qué cambió en cada una.
- **Commits**: hash y mensaje, si commiteó. Si no commiteó, decirlo.
- **Verificaciones**: el comando exacto y la salida real (o el resumen de la salida, si es larga, con el
  error completo cuando falla). Sin "debería pasar".
- **Dudas y decisiones**: lo que no se pudo resolver con la spec, y lo que el agente decidió sin preguntar,
  con el motivo.

El líder no da por bueno un reporte que no tenga las cuatro secciones.

## 6. Coordinación entre agentes y sesiones en el mismo repo

Varios agentes o sesiones pueden trabajar a la vez en un mismo repo. Reglas:

- **Archivos asignados**: cada agente recibe una lista. Tocar lo de otro es un error, aunque parezca
  inocuo.
- **Commit con pathspec**: `git commit -m "..." -- <archivos>`, nunca `git add -A`. Antes de commitear,
  `git diff --cached --name-only`.
- Un archivo que aparece modificado y no es propio: no se incluye en el commit ni se revierte. Se deja
  como está y se reporta.
- Si dos agentes necesitan el mismo archivo, uno espera o el líder decide el orden. No se pisan.
- Un repo ajeno (cliente o de otro dueño): no se toca sin pedirlo.

## 7. Relación con cavekit

`cavekit-build` ejecuta en un solo hilo por defecto. Para tareas grandes y separables, el planificador
puede partirla y delegar en `implementador` y `verificador`, siempre con la plantilla de la sección 4.
Para tareas chicas, sigue en un solo hilo.
