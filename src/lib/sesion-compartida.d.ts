export interface SesionPublica {
  accessToken: string;
  /** epoch en segundos */
  expiraEn: number;
  aal: string;
  usuario: { id: string; email: string | null };
}

export interface SesionCompartida {
  obtenerSesion(): Promise<SesionPublica | null>;
  obtenerToken(): Promise<string | null>;
  irAEntrar(volver?: string): void;
  salir(opciones?: { todas?: boolean }): Promise<void>;
  reverificar(codigo: string): Promise<SesionPublica>;
}

export function crearSesionCompartida(opciones: {
  urlCuenta: string;
  margenSegundos?: number;
  fetch?: typeof fetch;
  ahora?: () => number;
}): SesionCompartida;
