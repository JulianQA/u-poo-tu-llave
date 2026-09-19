import { createContext, useContext, useSyncExternalStore } from 'react'
import type { MiLlaveApp } from '@/app/MiLlaveApp'

export const MiLlaveContext = createContext<MiLlaveApp | null>(null)

/**
 * Devuelve la fachada del dominio y vuelve a renderizar el componente cada vez
 * que una operación (recarga, viaje, bloqueo) cambia el estado.
 */
export function useMiLlave(): MiLlaveApp {
  const app = useContext(MiLlaveContext)
  if (app === null) throw new Error('useMiLlave debe usarse dentro de <MiLlaveProvider>.')
  useSyncExternalStore(app.suscribir, app.obtenerVersion)
  return app
}
