import React, { useRef, useState } from 'react';
import { parse } from 'yaml';
import { Upload, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ErrorImportacion, lineasResumen, ResumenImportacion } from '../../lib/importarPortfolio';
// El `content.yml` que el portfolio de ESTE sitio usa de respaldo (texto crudo, sin parsear en el bundle).
import contenidoPortfolio from '@/data/content.yml?raw';
import { SectionTitle } from '../ui/Form';
import { Button } from '../ui/Button';

interface ImportarPortfolioProps {
  /** Aplica el YAML al estado local del editor. Lanza `ErrorImportacion` si ⊥ es un content.yml. */
  onImportar: (yml: unknown) => ResumenImportacion;
}

type Estado =
  | { tipo: 'vacio' }
  | { tipo: 'ok'; archivo: string; lineas: string[]; avisos: string[] }
  | { tipo: 'error'; archivo: string; mensaje: string };

/**
 * Trae TODO lo del portfolio (`content.yml`) al editor. ⊥ guarda nada: los cambios quedan sin
 * guardar y el owner los revisa; «Guardar» de la barra de arriba los escribe en Supabase.
 */
export const ImportarPortfolio: React.FC<ImportarPortfolioProps> = ({ onImportar }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: 'vacio' });

  /** Parsea el texto YAML y lo aplica al editor. Los errores quedan en el estado del componente. */
  const aplicarTexto = (texto: string, nombre: string) => {
    try {
      let yml: unknown;
      try {
        yml = parse(texto);
      } catch (err) {
        throw new ErrorImportacion(`No se pudo leer el YAML: ${err instanceof Error ? err.message : String(err)}`);
      }
      const resumen = onImportar(yml);
      setEstado({ tipo: 'ok', archivo: nombre, lineas: lineasResumen(resumen), avisos: resumen.avisos });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido al importar.';
      setEstado({ tipo: 'error', archivo: nombre, mensaje });
    }
  };

  const alElegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    // Dejar el input vacío: elegir el mismo archivo dos veces tiene que volver a disparar el cambio.
    e.target.value = '';
    if (!archivo) return;
    aplicarTexto(await archivo.text(), archivo.name);
  };

  const usarEsteSitio = () => aplicarTexto(contenidoPortfolio, 'content.yml de este sitio');

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-neutral-200 dark:border-gray-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle icon={<Upload className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}>Importar desde portfolio</SectionTitle>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={usarEsteSitio} className="gap-2">
            <Upload className="w-4 h-4" /> Usar el portfolio de este sitio
          </Button>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" /> Elegir content.yml
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".yml,.yaml,text/yaml,application/x-yaml"
          className="hidden"
          data-testid="importar-portfolio-archivo"
          onChange={alElegir}
        />
      </div>

      <p className="text-xs text-neutral-500 dark:text-gray-400">
        Mezcla el <code>content.yml</code> del portfolio (el de este sitio, o un archivo que elijas) con lo que ya
        cargaste: lo que trae pisa lo existente, y lo que no existe se agrega <strong>fuera del CV</strong>. Nada se
        guarda hasta que apretes «Guardar».
      </p>

      {estado.tipo === 'ok' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-4 text-sm space-y-2" role="status">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Importado {estado.archivo} (sin guardar)
            </p>
            <button onClick={() => setEstado({ tipo: 'vacio' })} className="text-neutral-400 hover:text-neutral-700" title="Cerrar resumen">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="list-disc pl-5 text-neutral-700 dark:text-gray-300 space-y-1">
            {estado.lineas.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          {estado.avisos.length > 0 && (
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900">
              <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Para revisar
              </p>
              <ul className="list-disc pl-5 text-neutral-700 dark:text-gray-300 space-y-1">
                {estado.avisos.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {estado.tipo === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300" role="alert">
          No se pudo importar {estado.archivo}: {estado.mensaje}
        </div>
      )}
    </div>
  );
};
