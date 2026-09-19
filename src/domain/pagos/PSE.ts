import { PagoRechazadoError } from '../errores'
import { esCorreoValido, validarTextoNoVacio } from '../validaciones'
import { MedioDePago } from './MedioDePago'

/** Débito desde la cuenta bancaria del usuario a través de PSE. */
export class PSE extends MedioDePago {
  readonly banco: string
  readonly correo: string

  constructor(banco: string, correo: string) {
    super()
    this.banco = validarTextoNoVacio(banco, 'El banco')
    this.correo = correo.trim()
  }

  get tipo() {
    return 'pse' as const
  }

  get nombre(): string {
    return `PSE (${this.banco})`
  }

  protected verificar(): void {
    if (!esCorreoValido(this.correo)) {
      throw new PagoRechazadoError('PSE necesita un correo válido para enviar la confirmación.')
    }
  }
}
