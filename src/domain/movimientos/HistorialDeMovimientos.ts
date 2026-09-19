import type { Movimiento, TipoMovimiento } from './Movimiento'

export interface FiltroDeMovimientos {
  tipo?: TipoMovimiento
  desde?: Date
  hasta?: Date
}

/** Consulta de solo lectura sobre los movimientos de una tarjeta. */
export class HistorialDeMovimientos {
  readonly #movimientos: readonly Movimiento[]

  constructor(movimientos: readonly Movimiento[]) {
    this.#movimientos = movimientos
  }

  get movimientos(): readonly Movimiento[] {
    return this.#movimientos
  }

  /** Más recientes primero. */
  ordenadoPorFecha(sentido: 'asc' | 'desc' = 'desc'): HistorialDeMovimientos {
    const factor = sentido === 'desc' ? -1 : 1
    const ordenados = this.#movimientos.toSorted((a, b) => factor * (a.fecha.getTime() - b.fecha.getTime()))
    return new HistorialDeMovimientos(ordenados)
  }

  filtrar({ tipo, desde, hasta }: FiltroDeMovimientos): HistorialDeMovimientos {
    const filtrados = this.#movimientos.filter(
      (m) =>
        (tipo === undefined || m.tipo === tipo) &&
        (desde === undefined || m.fecha >= desde) &&
        (hasta === undefined || m.fecha <= hasta),
    )
    return new HistorialDeMovimientos(filtrados)
  }

  ultimos(cantidad: number): HistorialDeMovimientos {
    return new HistorialDeMovimientos(this.ordenadoPorFecha().#movimientos.slice(0, cantidad))
  }

  get totalRecargado(): number {
    return this.#sumar('recarga')
  }

  get totalGastado(): number {
    return this.#sumar('viaje')
  }

  #sumar(tipo: TipoMovimiento): number {
    return this.#movimientos.reduce((suma, m) => (m.tipo === tipo ? suma + m.monto : suma), 0)
  }
}
