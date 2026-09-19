import { useState, type ReactNode } from 'react'
import { crearMiLlaveApp } from '@/app/composicion'
import { MiLlaveContext } from '@/context/mi-llave-context'

export function MiLlaveProvider({ children }: { children: ReactNode }) {
  // Inicializador perezoso: la app (y su lectura de localStorage) se crea una sola vez.
  const [app] = useState(crearMiLlaveApp)
  return <MiLlaveContext value={app}>{children}</MiLlaveContext>
}
