import { nuevoId } from '../ids'
import { validarMonto } from '../validaciones'

export type TipoMedioDePago = 'efectivo' | 'pse' | 'tarjeta'

export interface AutorizacionDePago {
  referencia: string
  medio: string
  monto: number
  fecha: Date
}

/**
 * Forma de pagar una recarga. Cada medio decide sus propias reglas de aprobación
 * (`verificar`) y cómo se muestra (`nombre`); el flujo de `autorizar` es común.
 */
export abstract class MedioDePago {
  abstract get tipo(): TipoMedioDePago

  /** Texto que se guarda en el movimiento y se muestra en el comprobante. */
  abstract get nombre(): string

  /** Lanza `PagoRechazadoError` si el medio no puede procesar este cobro. */
  protected abstract verificar(monto: number, fecha: Date): void

  autorizar(monto: number, fecha: Date): AutorizacionDePago {
    validarMonto(monto)
    this.verificar(monto, fecha)
    return { referencia: nuevoId(this.tipo.toUpperCase()), medio: this.nombre, monto, fecha }
  }
}
