---
name: caveman
description: "Modo de respuesta ultra-terso (niveles lite, full, ultra), revisión de código en una línea por hallazgo (review) y compresión de archivos de notas .md a ese estilo (compress). Usala cuando el usuario pida respuestas cortas, ahorrar tokens, /caveman, /caveman-review o /caveman:compress <ruta>. NO usarla para reglas obligatorias, avisos de seguridad, confirmaciones de acciones irreversibles, código, commits, PRs ni documentos de instrucciones que el agente debe cumplir: esos van en prosa normal."
---

# caveman

Tres modos, una skill:

| Modo | Cuándo | Qué hace |
|---|---|---|
| **respuesta** (por defecto) | el usuario pide brevedad o `/caveman` | responde en estilo terso, sin perder datos técnicos |
| **review** | `/caveman-review` o revisión de PR | un comentario por hallazgo: ubicación, problema, solución |
| **compress** | `/caveman:compress <ruta>` | reescribe un `.md` de notas en estilo terso, con backup |

## Ahorro real

El ahorro medido en muestras está entre **20 % y 35 %** de tokens, no el 75 % que se promocionaba.
Con prompt caching el ahorro de costo es chico; lo que de verdad mejora es la ventana de contexto.
No usar el modo como argumento de ahorro de costo sin medirlo.

## Modo respuesta

Niveles (por defecto `full`; cambiar con `/caveman lite|full|ultra`):

- **lite**: sin relleno ni rodeos; mantiene artículos y oraciones completas.
- **full**: fragmentos permitidos, sinónimos cortos (`fix` en vez de "implementar una solución para").
- **ultra**: abrevia prosa (DB, auth, config, req, res, fn, impl), usa flechas para causalidad. Nunca
  abrevia nombres de símbolos, funciones, APIs ni mensajes de error.

Ejemplos por nivel en `references/intensidades.md`.

Reglas del modo:

- Quitar artículos (en full y ultra), relleno (`básicamente`, `simplemente`), cortesías y hedging.
- Los términos técnicos, rutas, comandos y mensajes de error se copian exactos.
- Los bloques de código no se tocan.
- Patrón: `[cosa] [acción] [motivo]. [siguiente paso].`

### Cuándo volver a prosa normal

Escribir normal, aunque el modo esté activo, en estos casos:

- avisos de seguridad;
- confirmaciones de acciones irreversibles (borrar datos, drop, push forzado);
- secuencias de varios pasos donde la falta de conectores puede llevar a leerlas mal;
- la compresión crea ambigüedad técnica;
- el usuario pide aclaración o repite la pregunta.

Después de la parte clara, se retoma el modo.

Código, commits y PRs se escriben siempre en prosa normal. El modo se apaga con "modo normal" o
"stop caveman"; el nivel se mantiene hasta que se cambie o termine la sesión.

## Modo review

Formato de cada comentario, uno por línea:

- `L<línea>: <problema>. <fix>.` o `<archivo>:L<línea>: ...` en diffs de varios archivos.
- Prefijo de severidad cuando hay mezcla: `🔴 bug:` (rompe en producción), `🟡 risk:` (frágil),
  `🔵 nit:` (estilo, el autor puede ignorar), `❓ q:` (pregunta genuina, no sugerencia).
- Sin "noté que", "quizás", "podrías considerar". Si no estás seguro, usá `q:`.
- Mantener números de línea exactos, nombres de símbolos entre backticks y un fix concreto.

Salen listos para pegar en el PR. Excepciones en las que hace falta una explicación completa y no
una línea: hallazgos de seguridad (con referencia), desacuerdos de arquitectura y autores nuevos que
necesitan el porqué. En esos casos va un párrafo normal y el resto vuelve a ser terso.

El modo review no escribe el fix, no aprueba ni pide cambios y no corre linters.

## Modo compress

Reescribe un archivo de notas (`.md`, `.txt` o sin extensión) en estilo terso y deja un backup
`<nombre>.original.md`. Solo toca prosa: los bloques de código, el código en línea, URLs, rutas,
comandos, identificadores, números y encabezados se conservan exactos.

Uso (desde la carpeta de esta skill):

```bash
python3 -m scripts <ruta-absoluta-del-archivo>
```

El CLI detecta el tipo de archivo, comprime, valida, intenta corregir errores puntuales y, si falla
tres veces, deja el original intacto. Reglas completas en `references/comprimir.md`; qué hace y qué no
hace el código en `references/SEGURIDAD.md`.

**No comprimir** documentos de instrucciones que el agente debe cumplir (reglas de git, de cierre de
tarea, de seguridad o de prod): ahí la compresión intermedia es la que más rompe restricciones. Ese
tipo de documento va en prosa clara en español.

## Límites

- Nunca comprimir `.py`, `.js`, `.ts`, `.json`, `.yaml`, `.env`, `.lock`, `.sql` ni `.sh`.
- Nunca comprimir un `.original.md`.
- Si un dato se pierde al cortar una palabra, la palabra se queda: es compresión, no amputación.
