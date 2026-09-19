import { PagoRechazadoError } from '../errores'
import { validarTextoNoVacio } from '../validaciones'
import { MedioDePago } from './MedioDePago'

/** Pago en efectivo en un punto físico. Las cajas solo reciben múltiplos de $1.000. */
export class PuntoDeRecarga extends MedioDePago {
  readonly punto: string

  constructor(punto: string) {
    super()
    this.punto = validarTextoNoVacio(punto, 'El punto de recarga')
  }

  get tipo() {
    return 'efectivo' as const
  }

  get nombre(): string {
    return `Efectivo en ${this.punto}`
  }

  protected verificar(monto: number): void {
    if (monto % 1000 !== 0) {
      throw new PagoRechazadoError('En puntos de recarga el valor debe ser múltiplo de $1.000.')
    }
  }
}
