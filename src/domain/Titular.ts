import { DatosInvalidosError } from './errores'
import { TarjetaMiLlave } from './TarjetaMiLlave'
import { validarTextoNoVacio } from './validaciones'

export interface DatosTitular {
  id: string
  nombres: string
  apellidos: string
  documento: string
}

/** Persona dueña de una o más tarjetas. */
export class Titular {
  readonly id: string
  readonly nombres: string
  readonly apellidos: string
  readonly documento: string
  readonly #tarjetas: TarjetaMiLlave[] = []

  constructor(datos: DatosTitular) {
    this.id = validarTextoNoVacio(datos.id, 'El identificador del titular')
    this.nombres = validarTextoNoVacio(datos.nombres, 'Los nombres')
    this.apellidos = validarTextoNoVacio(datos.apellidos, 'Los apellidos')
    this.documento = validarTextoNoVacio(datos.documento, 'El documento')
  }

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`
  }

  get tarjetas(): readonly TarjetaMiLlave[] {
    return [...this.#tarjetas]
  }

  /** Crea una tarjeta nueva y la asocia a este titular. */
  emitirTarjeta(numero: string, saldoInicial = 0): TarjetaMiLlave {
    const tarjeta = new TarjetaMiLlave(numero, this, saldoInicial)
    this.agregarTarjeta(tarjeta)
    return tarjeta
  }

  /** Asocia una tarjeta existente (p. ej. al restaurarla desde el almacenamiento). */
  agregarTarjeta(tarjeta: TarjetaMiLlave): void {
    if (tarjeta.titular !== this) {
      throw new DatosInvalidosError('La tarjeta pertenece a otro titular.')
    }
    if (this.#tarjetas.some((t) => t.numero === tarjeta.numero)) {
      throw new DatosInvalidosError(`El titular ya tiene la tarjeta ${tarjeta.numero}.`)
    }
    this.#tarjetas.push(tarjeta)
  }
}
