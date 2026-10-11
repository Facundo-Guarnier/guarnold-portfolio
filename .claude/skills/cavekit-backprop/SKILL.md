---
name: cavekit-backprop
description: "Registra un bug con su causa: encuentra el error, rastrea la causa raíz, lo anota en §B de la tarea y agrega un invariante §V a SPEC.md si la regla es general. Usala ante un fallo de test en verificación, un reporte de bug o un incidente en producción. NO usarla para implementar una tarea nueva (cavekit-build) ni para un desvío sin bug (cavekit-check)."
---

# backprop: del bug a la tarea (§B) y a la spec (§V)

El desarrollo dirigido por spec corrige el código y, a la vez, actualiza la spec y la tarea para que el
mismo error no pueda volver a ocurrir.

## Cuándo se usa

- Un test falló durante la verificación de `/build`.
- El usuario reporta un bug.
- Después de un incidente en producción, como revisión posterior.
- `/check` marca un desvío como VIOLATE y ya encontró la causa raíz.

## Seis pasos

### 1. Rastrear

Leé la salida del fallo o el reporte del bug. Ubicá el archivo y la línea exactos donde el
comportamiento es incorrecto. Escribí la causa raíz en una sola oración.

### 2. Analizar

- ¿Un nuevo invariante en la §V de `SPEC.md` atraparía esta clase de error? Es la opción preferida.
- ¿El requerimiento de la §R de la tarea está mal?
- ¿La sección §B de la tarea activa es el lugar correcto para registrar esto?

### 3. Proponer

1. El ID de la tarea tiene que venir explícito en el pedido, con el formato `#YYYY-XXXX`.
2. No inventes, infieras ni mapees IDs desde ninguna fuente.
3. Si falta el ID, preguntá: "¿Cuál es el ID de la tarea activa?". Esperá la respuesta antes de seguir.

Después redactá el cambio:

- Una entrada en la §B de `.agents/tasks/YYYY-XXXX.md`.
- Una entrada en la §V de `SPEC.md`, solo si la regla es general.

### 4. Escribir el test

Agregá primero un test que falle. Su nombre tiene que citar el invariante o el ID de la tarea.

### 5. Verificar

Corregí el código y corré el test. Tiene que pasar.

### 6. Registrar

Commiteá juntos la edición de la tarea, la edición de la spec, el test y la corrección.
El mensaje de commit es `#YYYY-XXXX — backprop §B: <causa>`.

## Depuración sistemática

Antes de proponer cualquier arreglo, hay que encontrar la causa raíz. Un arreglo sobre el síntoma
no es un arreglo: tapa el fallo y deja la causa para el próximo.

1. **Leer el error completo.** Stack trace, números de línea, códigos de error y advertencias. No
   se saltea nada: muchas veces el mensaje ya dice dónde está el problema.
2. **Reproducir.** Hay que poder disparar el fallo con pasos concretos. Si no se reproduce, se
   juntan más datos (logs, entradas, estado); no se adivina.
3. **Una sola hipótesis.** Escribila en una frase: "Creo que X es la causa porque Y". Una hipótesis
   por vez, y específica.
4. **Probar en el mínimo.** Un cambio chico que pruebe la hipótesis, una variable a la vez. Si no
   resuelve el fallo, se formula una hipótesis nueva; no se apilan arreglos encima.
5. **Parar después de tres intentos fallidos.** Si tres arreglos no resolvieron el problema, se
   para. Eso indica un problema de diseño y no de hipótesis: se vuelve a leer la arquitectura del
   área afectada y se consulta al owner antes de un cuarto intento.

Adaptado de obra/superpowers (MIT), commit bb92a77741419a4ab5f06e711a283343f1ada0c3.

## Forma de la salida

Cada ejecución de backprop produce:

1. Una entrada en la §B de `.agents/tasks/YYYY-XXXX.md`.
2. Una entrada en la §V de `SPEC.md`, si la regla es nueva.
3. El archivo del test.
4. La corrección del código.

No se escribe nada en la §B de `SPEC.md`.
