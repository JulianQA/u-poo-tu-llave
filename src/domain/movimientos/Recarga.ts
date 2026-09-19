import { Movimiento, type DatosMovimiento } from './Movimiento'

export interface DatosRecarga extends DatosMovimiento {
  medioDePago: string
  referencia: string
}

export class Recarga extends Movimiento {
  readonly medioDePago: string
  /** Número de autorización que devolvió el medio de pago; aparece en el comprobante. */
  readonly referencia: string

  constructor(datos: DatosRecarga) {
    super(datos)
    this.medioDePago = datos.medioDePago
    this.referencia = datos.referencia
  }

  get tipo() {
    return 'recarga' as const
  }

  get descripcion(): string {
    return `Recarga con ${this.medioDePago}`
  }

  get efectoEnSaldo(): number {
    return this.monto
  }
}
