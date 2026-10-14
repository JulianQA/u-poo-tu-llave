import type { TipoServicio } from '@/domain/transporte/ServicioDeTransporte'
import { cn } from '@/lib/utils'

/** Color con el que se reconoce cada servicio en la calle: rojo troncal, azul zonal; el dual lleva ambos. */
const COLOR: Record<TipoServicio, string> = {
  troncal: 'bg-troncal',
  zonal: 'bg-zonal',
  dual: 'bg-[linear-gradient(90deg,var(--troncal)_50%,var(--zonal)_50%)]',
}

/** Punto de color decorativo: el nombre del servicio siempre va en texto al lado. */
export function MarcaDeServicio({ tipo, className }: { tipo: TipoServicio; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2.5 shrink-0 rounded-full', COLOR[tipo], className)} />
}
