import {
  DatosInvalidosError,
  MontoInvalidoError,
  SaldoInsuficienteError,
  TarjetaBloqueadaError,
} from './errores'
import { nuevoId } from './ids'
import { HistorialDeMovimientos } from './movimientos/HistorialDeMovimientos'
import type { Movimiento } from './movimientos/Movimiento'
import { Recarga } from './movimientos/Recarga'
import { Viaje } from './movimientos/Viaje'
import type { Titular } from './Titular'
import type { TipoServicio } from './transporte/ServicioDeTransporte'
import { validarMonto } from './validaciones'

export type EstadoTarjeta = 'activa' | 'bloqueada'

export interface DatosViajeNuevo {
  servicio: string
  tipoServicio: TipoServicio
  punto: string
  tarifa: number
  numeroTransbordo: number
  fecha: Date
}

export interface EstadoGuardado {
  estado: EstadoTarjeta
  saldo: number
  movimientos: readonly Movimiento[]
}

const PATRON_NUMERO = /^\d{16}$/

/**
 * Tarjeta Tu Llave. Es la única que puede cambiar su saldo: el estado y el saldo son privados
 * y solo se modifican mediante `registrarRecarga` y `registrarViaje`, que validan las reglas
 * y dejan siempre un `Movimiento` como rastro.
 */
export class TarjetaMiLlave {
  readonly numero: string
  readonly titular: Titular
  #estado: EstadoTarjeta = 'activa'
  #saldo: number
  #movimientos: Movimiento[] = []

  constructor(numero: string, titular: Titular, saldoInicial = 0) {
    const limpio = numero.replace(/\s+/g, '')
    if (!PATRON_NUMERO.test(limpio)) {
      throw new DatosInvalidosError('El número de la tarjeta debe tener 16 dígitos.')
    }
    if (!Number.isInteger(saldoInicial) || saldoInicial < 0) {
      throw new MontoInvalidoError('El saldo inicial debe ser un entero de pesos mayor o igual que cero.')
    }
    this.numero = limpio
    this.titular = titular
    this.#saldo = saldoInicial
  }

  /** Reconstruye una tarjeta guardada sin volver a aplicar las reglas de cada movimiento. */
  static restaurar(numero: string, titular: Titular, guardado: EstadoGuardado): TarjetaMiLlave {
    const tarjeta = new TarjetaMiLlave(numero, titular, guardado.saldo)
    tarjeta.#estado = guardado.estado
    tarjeta.#movimientos = [...guardado.movimientos]
    return tarjeta
  }

  get estado(): EstadoTarjeta {
    return this.#estado
  }

  get estaActiva(): boolean {
    return this.#estado === 'activa'
  }

  get saldo(): number {
    return this.#saldo
  }

  get historial(): HistorialDeMovimientos {
    return new HistorialDeMovimientos(this.#movimientos)
  }

  /** Último viaje registrado, usado para decidir si el siguiente es transbordo. */
  get ultimoViaje(): Viaje | undefined {
    return this.historial.ordenadoPorFecha().movimientos.find((m): m is Viaje => m instanceof Viaje)
  }

  bloquear(): void {
    this.#estado = 'bloqueada'
  }

  activar(): void {
    this.#estado = 'activa'
  }

  asegurarActiva(): void {
    if (!this.estaActiva) throw new TarjetaBloqueadaError(this.numero)
  }

  registrarRecarga(monto: number, medioDePago: string, referencia: string, fecha: Date): Recarga {
    this.asegurarActiva()
    validarMonto(monto)
    this.#saldo += monto
    const recarga = new Recarga({
      id: nuevoId('REC'),
      fecha,
      monto,
      saldoResultante: this.#saldo,
      medioDePago,
      referencia,
    })
    this.#movimientos.push(recarga)
    return recarga
  }

  registrarViaje(datos: DatosViajeNuevo): Viaje {
    this.asegurarActiva()
    if (!Number.isInteger(datos.tarifa) || datos.tarifa < 0) {
      throw new MontoInvalidoError('La tarifa debe ser un entero de pesos mayor o igual que cero.')
    }
    if (datos.tarifa > this.#saldo) {
      throw new SaldoInsuficienteError(this.#saldo, datos.tarifa)
    }
    this.#saldo -= datos.tarifa
    const viaje = new Viaje({
      id: nuevoId('VIA'),
      fecha: datos.fecha,
      monto: datos.tarifa,
      saldoResultante: this.#saldo,
      servicio: datos.servicio,
      tipoServicio: datos.tipoServicio,
      punto: datos.punto,
      numeroTransbordo: datos.numeroTransbordo,
    })
    this.#movimientos.push(viaje)
    return viaje
  }
}
