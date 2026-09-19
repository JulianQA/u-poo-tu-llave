import { PagoRechazadoError } from '../errores'
import { MedioDePago } from './MedioDePago'

export type TipoTarjetaBancaria = 'debito' | 'credito'

export interface DatosTarjetaBancaria {
  tipoTarjeta: TipoTarjetaBancaria
  numero: string
  /** Mes de vencimiento, 1 a 12. */
  mes: number
  /** Año de vencimiento con cuatro dígitos. */
  anio: number
  cvv: string
}

/** Algoritmo de Luhn: validación estándar del número de una tarjeta bancaria. */
function pasaLuhn(numero: string): boolean {
  let suma = 0
  let duplicar = false
  for (let i = numero.length - 1; i >= 0; i--) {
    let digito = Number(numero[i])
    if (duplicar) {
      digito *= 2
      if (digito > 9) digito -= 9
    }
    suma += digito
    duplicar = !duplicar
  }
  return suma % 10 === 0
}

/** Tarjeta débito o crédito. Se rechaza si el número, el vencimiento o el CVV no son válidos. */
export class TarjetaBancaria extends MedioDePago {
  readonly #datos: DatosTarjetaBancaria

  constructor(datos: DatosTarjetaBancaria) {
    super()
    this.#datos = { ...datos, numero: datos.numero.replace(/\s+/g, '') }
  }

  get tipo() {
    return 'tarjeta' as const
  }

  get nombre(): string {
    const clase = this.#datos.tipoTarjeta === 'debito' ? 'débito' : 'crédito'
    return `Tarjeta ${clase} terminada en ${this.#datos.numero.slice(-4)}`
  }

  protected verificar(_monto: number, fecha: Date): void {
    const { numero, mes, anio, cvv } = this.#datos
    if (!/^\d{13,19}$/.test(numero) || !pasaLuhn(numero)) {
      throw new PagoRechazadoError('El número de la tarjeta no es válido.')
    }
    const vencida = anio < fecha.getFullYear() || (anio === fecha.getFullYear() && mes < fecha.getMonth() + 1)
    if (!Number.isInteger(mes) || mes < 1 || mes > 12 || vencida) {
      throw new PagoRechazadoError('La tarjeta está vencida o la fecha de vencimiento es inválida.')
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      throw new PagoRechazadoError('El código de seguridad (CVV) debe tener 3 o 4 dígitos.')
    }
  }
}
