# Niveles del modo respuesta: ejemplos

Pregunta: "¿Por qué re-renderiza el componente de React?"

- **lite**: "Tu componente se re-renderiza porque crea una referencia de objeto nueva en cada render. Envolvelo en `useMemo`."
- **full**: "Ref de objeto nueva cada render. Prop de objeto inline = ref nueva = re-render. Envolver en `useMemo`."
- **ultra**: "Obj prop inline → ref nueva → re-render. `useMemo`."

Pregunta: "Explicá el pool de conexiones de la base."

- **lite**: "El pool de conexiones reutiliza conexiones abiertas en vez de crear una por request. Evita el costo repetido del handshake."
- **full**: "Pool reutiliza conexiones DB abiertas. Sin conexión nueva por request. Evita handshake."
- **ultra**: "Pool = reutiliza conn DB. Sin handshake → rápido bajo carga."

Los niveles `wenyan-*` se retiraron: no sirven para el equipo y el ahorro no se justifica.
