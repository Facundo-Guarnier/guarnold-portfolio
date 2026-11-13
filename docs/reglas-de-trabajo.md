# Reglas de trabajo (git, ramas, PR, "listo", preguntas, entorno)

Fuente única de las reglas transversales de este repo. `AGENTS.md` las enlaza y el hub
(`guarnold-hub/METODOLOGIA.md`) las enlaza también: si cambia una, se cambia acá.

## 1. Ramas

| Rama | Para qué | Regla |
|---|---|---|
| `main` | Producción. Netlify y el host despliegan esta rama | Protegida. Entra **solo por PR desde `dev`**. Sin force-push ni borrado |
| `dev` | Trabajo diario. Rama por defecto | El agente commitea acá. Los checks de CI corren también en `dev` |
| `feat/…`, `fix/…`, `chore/…` | Cambios que no caben en un commit verificado, o que tocan varios módulos | PR a `dev` |
| `backup/<motivo>` | Foto antes de algo irreversible | Local. No se pushea. Se borra cuando lo respaldado se confirmó |
| `dependabot/**` | La crea GitHub | La cierra el merge. Si el PR se cierra sin mergear, se borra a mano |

- Crear una rama nueva: verificar la rama por defecto con `git symbolic-ref --short HEAD`
  (`git init` puede crear `master`).
- Antes de renombrar o borrar una rama: `git rev-list --count A..B` para confirmar que no se pierden commits.
- En repos de cliente, una rama remota borrada no se recupera: borrar solo lo propio.

### Por qué `dev` tiene CI

Si la convención dice "se trabaja en `dev`" y el CI solo corre en `push` a `main`, lo que se
commitea a `dev` no lo mira nadie hasta el PR, que es cuando ya es tarde. La protección de `main`
tiene que estar donde ocurre el trabajo: el CI corre en `push` y `pull_request` de `main` **y** `dev`.

## 2. Commits

- Los hace el agente cuando la tarea está completa **y verificada**.
- **Staging explícito**: `git add <archivo>` por archivo. Nunca `git add -A` ni `git add .`: otros
  agentes o sesiones pueden estar tocando el mismo repo, y el `-A` barre dumps y `.env`.
- Commit con pathspec: `git commit -m "..." -- <archivos>`. Antes del commit, `git diff --cached --name-only`
  para confirmar que solo entra lo propio.
- Mensajes en el idioma del repo (español en la plantilla), en modo imperativo, con una línea de resumen.
- Nunca `--no-verify` para esquivar un hook. Si un hook falla, se investiga y se arregla la causa. Si
  falla por algo ajeno a los archivos propios, se reporta con la salida real y no se saltea.

## 3. Push, PR y merge a `main`

El flujo real es este (no hay push directo a `main`):

1. El agente commitea en `dev`.
2. **El PR de `dev` a `main` se abre recién cuando el owner pide el merge.** Un PR abierto dispara los
   checks de Actions en cada push a `dev`: abrirlo "para publicar" gasta minutos y ensucia sin aportar.
   Tampoco se ofrece abrirlo como siguiente paso. Cuando el owner lo pide: `gh pr create --base main
   --head dev`, con el plan de migraciones y funciones en la descripción.
3. El `git push origin dev` lo hace el owner por su cuenta. El agente lo hace solo si se lo piden o si
   el flujo lo necesita. **No se le recuerda al owner que pushee** ni se cierran las respuestas con
   «N commits sin pushear». Si hace falta mencionar el estado del remoto, `git fetch` primero: un
   `ahead`/`behind` sin fetch es una foto vieja, no un hecho.
4. Esperar el CI del PR. Si falla, `pr-fix` antes de tocar nada más.
5. El merge a `main` (y la aprobación de un PR, `gh pr review --approve`) lo hace el agente **solo con
   autorización explícita del owner para ese PR**. La autorización vale únicamente para el pedido en
   que se dio: un «hacé todos los merges necesarios» anterior no cubre el PR siguiente. Sin ella, el PR
   queda abierto y se avisa.
6. Si el front depende de una migración que el CI de despliegue todavía no puede aplicar (por
   ejemplo, faltan los secretos del environment `produccion`), el merge lleva `[skip netlify]` en el
   título del commit: si no, Netlify publica el front antes que la base y las pantallas con login fallan.
7. Al mergear a `main`, el CI de despliegue de Supabase aplica las migraciones pendientes y las
   funciones cambiadas (ver `docs/guides/supabase-entornos-y-migraciones.md`). Cuando hay migraciones
   o funciones en el PR, el plan va en la descripción del PR.
8. **No dar por desplegado un merge sin ver que el job de despliegue corrió.** Si Actions no arranca
   jobs (facturación, cupo agotado), el merge a `main` sale sin despliegue de base mientras el front de
   Netlify se publica igual. Por eso el código del servidor o del front no puede depender de una
   migración nueva sin tolerar que todavía no exista. Detalle en la plantilla del hub: `guarnold-hub/base-proyectos/docs/guides/ci-minutos.md`.

Reglas que no cambian:

- **Nunca** `git push --force` a `main` ni a `dev`.
- **Nunca** un commit directo a `main`.
- Un PR a `main` es lo único que llega a producción: su descripción dice qué cambia para el usuario,
  qué migraciones entran y si hace falta `[skip netlify]`.
- El auto-merge de agentes revisores (ver `docs/principles/trabajo-con-varios-agentes.md` §8) opera
  sobre la rama de trabajo, nunca sobre `main`.

## 4. Definición de "listo"

Una tarea está terminada cuando las tres pasan, **ejecutadas de verdad**:

1. **Compila**: typecheck y build sin errores.
2. **Lint limpio**, donde esté configurado.
3. **Tests en verde**, donde existan.

Si algo falla, se reporta con la salida real. No se da por cumplido lo que no se corrió.
Un cambio de DB, permisos o comportamiento también requiere verificación en la app real o en la base
ephemeral, no solo que el build pase.

## 5. Preguntas al owner y autonomía

- **Preguntar antes de asumir.** Falta información para planificar, una tabla, un rol o una regla de
  negocio → preguntar. No inventarlos.
- **Agentes de verificación** (buscar huecos, contradicciones o errores en un plan o en tareas): una
  revisión normal y la delegación habitual se lanzan **sin preguntar**. Se pregunta **solo antes de un
  barrido grande o caro**: muchos agentes, Ultracode o un workflow grande, donde el gasto de tokens es
  una decisión del owner.
- **Terminar el trabajo hasta que quede bien.** No cerrar cada tramo con «¿sigo?» ni pedir permiso para
  lo básico (commits en `dev` de un repo propio, crear archivos locales, usar el stack local si Docker
  ya está corriendo): se hace y se reporta al final.
- **Preguntar solo decisiones reales**: alcance ambiguo con consecuencias distintas, borrar algo,
  credenciales o paneles, decisiones de producto. Sigue siendo del owner: merge a `main`, escribir en
  la nube, borrar datos.
- **Fin de sesión**: la sesión termina cuando no queda nada en que avanzar. Si una tarea se traba,
  se sigue con lo que no depende de esa respuesta y la pregunta queda asentada en el archivo de estado.
- Cosas que solo el owner puede hacer (paneles web, credenciales, decisiones): se listan como
  pendiente con ⏸️ y no se intenta hacerlas.
- **Pendientes al cerrar.** Al terminar un trabajo, los pendientes importantes (decisiones del owner,
  pases a `main`, revisiones manuales en paneles, arreglos propuestos sin aprobar) se cargan como
  tareas, sin preguntar y avisando los números. Cómo: `docs/guides/tareas-en-guarnote.md`.

## 6. Repos de cliente

Pueden tener datos reales, credenciales y NDA. Ante la duda, preguntar antes de exponer algo.
No mezclar nombres, roles ni prefijos de un proyecto en otro.

## 7. Seguridad mínima

- **Prioridad: la escritura.** Integridad por encima de confidencialidad. Que alguien lea de más es
  grave pero no irreparable; que alguien pueda *escribir* (datos, roles, tokens, despliegues, DNS) es
  lo que hace daño real. Al diseñar o revisar, primero se listan **todas** las vías de escritura (base,
  funciones, tokens de proveedores con permiso de escritura, CI, despliegues) y se cierra cada una con
  capas: mínimo privilegio, `aal2`, lista blanca de operaciones, auditoría y alerta. Un token de
  proveedor es de solo lectura donde el proveedor lo permita; donde no, el intermediario emite solo
  `GET` a hosts fijos y eso se testea.
- Ningún secreto en el repo ni en `.env.example` (solo placeholders).
- Sin `service_role` en servidores ni en el cliente: el acceso administrativo va por funciones SQL
  `SECURITY DEFINER` que exigen el rol del administrador y `aal2`, llamadas con el token del propio
  usuario. Receta en la plantilla del hub: `guarnold-hub/base-proyectos/docs/guides/auth-y-sesiones.md` §9.
- Lo configurable (orígenes permitidos, remitentes, parámetros de negocio) se edita **dentro de la
  app**, no en variables de entorno. Las variables de entorno quedan para secretos reales y URLs de
  infraestructura.
- Prod es de solo lectura para el agente (ver la guía de Supabase).

## 8. Herramientas, entorno y errores

- **No descargar ni ejecutar herramientas de afuera** (binarios, scripts, utilidades de foros o de
  repositorios ajenos). Si una tarea necesita una, se le dice al owner cuál es y de dónde: él la baja,
  la verifica y recién entonces la entrega. En las investigaciones delegadas se indica «no descargues
  nada»; se prefiere código propio o lo ya instalado. Las excepciones son por proyecto y viven en el
  `AGENTS.md` de ese repo.
- **Docker.** Si Docker está cerrado, o se cae a mitad del trabajo, no se lo abre ni se reintenta hasta
  que levante: el owner puede estar apagándolo (consume mucha RAM). Se avisa qué quedó sin probar y se
  sigue con lo que no lo necesita. Lo que se levantó se apaga al terminar. Cuando hay que experimentar
  con la base (probar, romper, medir), se hace en el Supabase local de Docker, nunca en la nube.
- **Acceso a un MCP.** Que el `.mcp.json` y el wrapper estén instalados, o que el wrapper arranque como
  proceso suelto, no es tener acceso: los servidores MCP se registran por sesión y se aprueban con
  `/mcp`. Sin acceso real, no se afirma nada sobre datos, tablas, políticas o migraciones aplicadas, y
  no se inventan: se le pide el estado al owner o se leen las migraciones versionadas.
- **Documentar los errores.** Todo error que aparece y se arregla se anota en el doc de errores
  conocidos del repo (síntoma, causa, arreglo, dónde está en el código, cómo se detecta). Al delegar un
  arreglo se incluye «agregar la entrada al doc de errores» en el pedido; al revisar, se verifica que
  esté.
- **Prompts para herramientas externas de investigación** (una IA con búsqueda web, por ejemplo): cada
  consulta es independiente y la herramienta no ve la conversación ni las búsquedas previas. El prompt
  lleva todo el contexto adentro (objetivo, requisitos, lo ya resuelto) y nunca dice «como en la
  investigación anterior»: si hay que citar un resultado previo, se copia su contenido.
