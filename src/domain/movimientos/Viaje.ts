import type { TipoServicio } from '../transporte/ServicioDeTransporte'
import { Movimiento, type DatosMovimiento } from './Movimiento'

export interface DatosViaje extends DatosMovimiento {
  servicio: string
  tipoServicio: TipoServicio
  punto: string
  /** 0 si el viaje se pagó completo; 1, 2… según la cadena de transbordos. */
  numeroTransbordo: number
}

export class Viaje extends Movimiento {
  readonly servicio: string
  readonly tipoServicio: TipoServicio
  readonly punto: string
  readonly numeroTransbordo: number

  constructor(datos: DatosViaje) {
    super(datos)
    this.servicio = datos.servicio
    this.tipoServicio = datos.tipoServicio
    this.punto = datos.punto
    this.numeroTransbordo = datos.numeroTransbordo
  }

  get tipo() {
    return 'viaje' as const
  }

  get esTransbordo(): boolean {
    return this.numeroTransbordo > 0
  }

  get descripcion(): string {
    const base = `${this.servicio} en ${this.punto}`
    return this.esTransbordo ? `${base} (transbordo)` : base
  }

  get efectoEnSaldo(): number {
    return -this.monto
  }
}
