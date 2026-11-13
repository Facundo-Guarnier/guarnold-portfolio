# Trabajo con varios agentes

Criterio para decidir cuándo usar subagentes, con qué modelo y cómo delegarles. Las definiciones
están en `.claude/agents/` (`relevador`, `implementador`, `verificador`, `revisor`).

Fuentes: [Anthropic, sistema multiagente de investigación](https://www.anthropic.com/engineering/multi-agent-research-system)
(patrón orquestador-trabajador: el líder planifica y lanza trabajadores con contexto limpio; costo cercano a
15 veces el de un chat) y [documentación de subagentes de Claude Code](https://code.claude.com/docs/en/sub-agents).
La receta "Opus planifica, un modelo más barato ejecuta" no está en la fuente oficial: es una práctica que
funcionó en el hub, y se trata como tal. El objetivo principal de delegar es **proteger el contexto del líder**:
repartir el trabajo no sirve si después el hilo principal se satura con diffs y logs. Por eso el líder pide
resultados resumidos (informe corto) y no vuelca diffs ni logs enteros en su contexto.

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
buscan, verifican o aplican cambios acotados. Lo que el líder **no** hace es los arreglos inline, ni los
«chicos»: llenan su contexto y usan el modelo más caro. Planifica, delega, revisa el reporte y integra.

## 3. Modelo por tipo de tarea

| Tarea | Modelo | Por qué |
|---|---|---|
| Plan, diseño, decisiones de arquitectura, síntesis | Opus (el líder) | Requiere juicio sobre el conjunto |
| Revisión de diffs y de planes | Sonnet en contexto fresco (`revisor`); Opus solo si el juicio es difícil | Detectar lo que el autor no vio |
| Implementar (`implementador`) | Sonnet; Haiku solo si el cambio es mecánico con spec cerrada | Un cambio no trivial necesita razonar |
| Relevar, buscar, leer y resumir (`relevador`) | Haiku | Barato, lectura pura |
| Correr verificaciones: tests, typecheck, build, lint (`verificador`) | Haiku | Ejecuta y reporta; no decide |
| Auditoría de seguridad y de flujos | Sonnet u Opus | Razonamiento sobre permisos y casos límite; lo pide `multilayer-flow-verification` |

Quién revisa y quién acepta lo trabajado por subagentes está en la §8 («Aceptar»): el líder lee el
reporte y verifica; el owner no lee diffs.

Los agentes de verificación que buscan huecos o contradicciones consumen muchos tokens. Una revisión
normal se lanza sin preguntar; **solo un barrido grande o caro** (muchos agentes, Ultracode, un workflow
grande) se pregunta al owner antes (ver `docs/reglas-de-trabajo.md` §5).

La tabla dice qué rol hace cada cosa. Para el modelo concreto de un `Agent` o `Workflow`, donde difiera,
manda la §8.

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
- **A un agente de `Workflow` que está corriendo no se le manda `SendMessage`.** El mensaje no espera a
  la corrida viva: reanuda otra copia del mismo agente con el mismo contexto, y las dos editan el mismo
  árbol de trabajo (y usan los mismos recursos, como una instancia de un programa) a la vez. Para
  cambiarle las instrucciones se detiene el workflow y se relanza con el pedido completo. `SendMessage`
  sirve solo con agentes lanzados con `Agent` que ya terminaron, o con sesiones pares.

## 7. Relación con cavekit

`cavekit-build` ejecuta en un solo hilo por defecto. Para tareas grandes y separables, el planificador
puede partirla y delegar en `implementador` y `verificador`, siempre con la plantilla de la sección 4.
Para tareas chicas, sigue en un solo hilo.

## 8. Dos vías de delegación

Hay dos formas de repartir trabajo y no se mezclan. Las secciones 1 a 7 describen la primera.

| | Agent / Workflow de Claude | Orquestador (meta-orchestrator) |
|---|---|---|
| Qué es | Subagentes nativos de la sesión (`Agent`, `Workflow`) | Servidor MCP `orquestador` y skill `/orquestar`: reparte por nivel de capacidad y por cuota entre modelos de otros proveedores |
| Cuándo | Trabajo chico, que necesita el contexto de la sesión, lectura y verificación, o proteger el contexto del líder | Volumen o trabajo largo en tareas autocontenidas; gastar la cuota de otros proveedores |
| Modelo | Lo fija quien delega (`model`) | No lo elige el líder: elige el nivel (1 a 3, el más bajo que alcance) y el orquestador elige la variante |
| Aislamiento | El repo de la sesión, con archivos asignados (§6) | Un worktree y una rama `agent/task_<id>` por tarea |
| Reporte | El de la §5 | El bloque INFORME (hecho, pendiente, dudas, revisar) |
| Commit | El agente commitea con pathspec (§6) | Lo hace el orquestador; el subagente no commitea |
| Aceptar | El líder lee el reporte y verifica, o delega la revisión a un `revisor`; no vuelca el diff entero en su contexto | Auto-merge a la rama de trabajo: otro agente revisa el diff y mergea solo. Lo que queda bloqueado lo resuelve el líder, nunca el owner leyendo diffs; a `main` no entra por esta vía |

En ninguna de las dos vías el owner lee diffs. Al owner se le escala únicamente lo suyo: secretos,
efectos externos (nube, despliegues, mensajes) y `main`. A `main` se llega solo por el PR que el owner
autoriza (`docs/reglas-de-trabajo.md` §3).

**Cuál elegir.** El criterio es proteger el contexto del líder y repartir bien los tokens y las cuotas:
si la tarea es chica, puntual o necesita el contexto de la sesión, la hace un `Agent` o `Workflow`; si es
volumen o trabajo largo en tareas autocontenidas y hay cuota de otros proveedores, va al orquestador; si
la calidad importa o esas cuotas están agotadas, `Agent` o `Workflow` con el modelo adecuado.

**Qué tabla de modelos manda.** En un `Agent` o `Workflow` se fija siempre `model`: `sonnet` por defecto,
`haiku` solo para lo mecánico y la lectura pura (relevar, correr verificaciones), `opus` solo para síntesis
y juicio. Un workflow de muchos agentes que hereda Opus gasta del orden de millones de tokens de más. Eso manda sobre la tabla de la §3 donde difieran (por ejemplo, un `implementador` con un cambio no
trivial va en `sonnet`). Sin `model`, el agente hereda el del líder, que es el más caro. En el orquestador
no hay modelo que fijar: manda el nivel, como dice su skill.

**Una trampa de costo.** Algunas variantes del orquestador usan la misma suscripción de Claude que la sesión.
Si `estado` muestra que solo quedan activas esas, delegar al orquestador gasta la misma cuota con menos
control: conviene un `Agent` o `Workflow` con `model` fijado.

**Diseño.** Lo de la §2 vale para el diseño que depende de contexto compartido. La auditoría y la lectura de
mucho código sí se delegan (en el orquestador, como tarea de solo lectura de nivel 2 o 3).

Detalle del orquestador: la skill `claude/skills/orquestar/SKILL.md` del repo `personal/meta-orchestrator`
(sección «Ruteo»).
