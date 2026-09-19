import type { PuntoDeAcceso } from './PuntoDeAcceso'
import { ServicioDeTransporte } from './ServicioDeTransporte'

/** Rutas zonales del SITP: se paga en el validador del bus, en un paradero. */
export class SitpZonal extends ServicioDeTransporte {
  get tipo() {
    return 'zonal' as const
  }

  admite(punto: PuntoDeAcceso): boolean {
    return punto.tipo === 'paradero'
  }
}
