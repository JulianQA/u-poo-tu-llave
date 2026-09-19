export type TipoMovimiento = 'recarga' | 'viaje'

export interface DatosMovimiento {
  id: string
  fecha: Date
  monto: number
  saldoResultante: number
}

/**
 * Registro inmutable de algo que cambió el saldo de una tarjeta.
 * Las subclases concretas (`Recarga`, `Viaje`) definen el signo del efecto y su descripción.
 */
export abstract class Movimiento {
  readonly id: string
  readonly fecha: Date
  readonly monto: number
  readonly saldoResultante: number

  constructor(datos: DatosMovimiento) {
    this.id = datos.id
    this.fecha = datos.fecha
    this.monto = datos.monto
    this.saldoResultante = datos.saldoResultante
  }

  abstract get tipo(): TipoMovimiento

  abstract get descripcion(): string

  /** Variación del saldo: positiva para abonos, negativa para cargos. */
  abstract get efectoEnSaldo(): number
}
