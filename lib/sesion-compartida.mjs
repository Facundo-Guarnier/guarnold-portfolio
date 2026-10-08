// COPIA de personal/guarnold-id/paquete/sesion-compartida.mjs — la fuente es esa. Cambiarla allá y copiar.
/**
 * Cliente de la sesión de `id.guarnold.com.ar` para las apps (pivot, guarnote, cv…).
 *
 * La app NUNCA tiene el pase de renovación: vive en una cookie HttpOnly de `cuenta`. Le pide a
 * `cuenta` un pase de ACCESO (10 min), lo guarda solo en memoria, y con eso consulta Supabase
 * directo. Un XSS en la app se lleva, como mucho, un pase que muere en 10 minutos.
 * 🔗 guarnold-hub/docs/cuenta-central.md («variante 2»).
 *
 * Uso con supabase-js:
 *
 *   const sesion = crearSesionCompartida({ urlCuenta: 'https://id.guarnold.com.ar' })
 *   const supabase = createClient(URL, CLAVE, { accessToken: () => sesion.obtenerToken() })
 *   if (!(await sesion.obtenerSesion())) sesion.irAEntrar()
 *
 * ⚠️ Con `accessToken`, `supabase.auth.*` queda deshabilitado (es lo que se busca): el login, el
 * logout y los 2 pasos son de `cuenta`.
 *
 * @param {{ urlCuenta: string, margenSegundos?: number, fetch?: typeof fetch, ahora?: () => number }} opciones
 */
export function crearSesionCompartida({
  urlCuenta,
  margenSegundos = 60,
  fetch: f = globalThis.fetch.bind(globalThis),
  ahora = () => Date.now() / 1000,
}) {
  const base = urlCuenta.replace(/\/+$/, '')
  /** @type {import('./sesion-compartida').SesionPublica | null} */
  let sesion = null
  /** @type {Promise<import('./sesion-compartida').SesionPublica | null> | null} */
  let enCurso = null

  const pedir = (ruta, cuerpo = {}) =>
    f(`${base}/api${ruta}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })

  async function renovar() {
    const r = await pedir('/renovar')
    if (r.status === 401) {
      sesion = null
      return null
    }
    if (!r.ok) throw new Error(`cuenta respondió ${r.status} al renovar`)
    sesion = (await r.json()).sesion
    return sesion
  }

  /**
   * La sesión vigente, renovándola si está por vencer. `null` = ⊥ hay sesión (ir a entrar).
   * Pedidos simultáneos comparten UNA renovación: dos en paralelo usarían el mismo pase de
   * renovación, y el segundo uso parece un robo → Supabase anula la sesión.
   */
  async function obtenerSesion() {
    if (sesion && sesion.expiraEn - margenSegundos > ahora()) return sesion
    enCurso ??= renovar().finally(() => {
      enCurso = null
    })
    return enCurso
  }

  return {
    obtenerSesion,
    /** Para `createClient(..., { accessToken })`. `null` → el pedido sale como anónimo. */
    async obtenerToken() {
      return (await obtenerSesion())?.accessToken ?? null
    },
    /** Manda a `cuenta` a entrar y vuelve a donde estaba. */
    irAEntrar(volver = globalThis.location?.href) {
      globalThis.location.assign(`${base}/entrar?volver=${encodeURIComponent(volver ?? '')}`)
    },
    /**
     * Volver a ingresar el código de 2 pasos (acciones sensibles: crear un token del MCP exige el
     * código de hace ≤ 5 min). La sesión nueva trae el `amr` con la hora de ahora y pisa la cacheada.
     * Código incorrecto → TIRA con el mensaje para mostrar.
     */
    async reverificar(codigo) {
      const r = await pedir('/reverificar', { codigo })
      const datos = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(datos.mensaje ?? 'No se pudo verificar el código')
      sesion = datos.sesion
      return sesion
    },
    /** `todas: true` cierra la sesión en todos los dispositivos y apps. Si falla, TIRA. */
    async salir({ todas = false } = {}) {
      const r = await pedir('/salir', { todas })
      if (!r.ok) throw new Error('No se pudo cerrar la sesión')
      sesion = null
    },
  }
}
