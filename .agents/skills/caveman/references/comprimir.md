# Reglas de compresión de archivos de notas

Estas reglas rigen el modo compress de la skill `caveman`. Son para archivos de **notas** (memoria,
TODOs, preferencias), no para documentos de instrucciones que el agente debe obedecer.

## Quitar

- Artículos: a, an, the (en español: el, la, los, las, un, una cuando no aportan).
- Relleno: just, really, basically, actually, simply, essentially, generally (y sus equivalentes).
- Cortesías: "sure", "certainly", "of course", "happy to", "I'd recommend".
- Hedging: "it might be worth", "you could consider".
- Frases redundantes: "in order to" → "to"; "make sure to" → "ensure"; "the reason is because" → "because".
- Conectores de relleno: "however", "furthermore", "additionally".

## Conservar exacto

- Bloques de código (cercados con ``` o indentados).
- Código en línea entre backticks.
- URLs y enlaces markdown.
- Rutas de archivo, comandos, nombres de librerías, APIs y protocolos.
- Nombres propios, fechas, versiones y valores numéricos.
- Variables de entorno.

## Conservar la estructura

- Todos los encabezados, con el texto exacto; se comprime el cuerpo debajo.
- Jerarquía de viñetas y numeración de listas.
- Tablas: se comprime el texto de las celdas, no la estructura.
- Frontmatter YAML.

## Comprimir

- Sinónimos cortos: "big", "fix", "use".
- Fragmentos permitidos: "Run tests before push to main".
- Quitar "you should", "make sure to", "remember to": se enuncia la acción.
- Unir viñetas que dicen lo mismo de distinta forma.
- De varios ejemplos del mismo patrón, dejar uno.

## Regla crítica

Lo que está dentro de ``` ... ``` se copia exacto: sin quitar comentarios, sin cambiar espacios, sin
reordenar líneas, sin acortar comandos. Lo que está entre backticks tampoco se toca. Si un archivo
mezcla prosa y código, se comprime solo la prosa, sin fusionar secciones alrededor del código.

## Ejemplo

Original: "You should always make sure to run the test suite before pushing any changes to the main branch. This is important because it helps catch bugs early."

Comprimido: "Run tests before push to main. Catch bugs early."
