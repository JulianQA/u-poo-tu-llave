import { MontoInvalidoError } from './errores'
import type { MedioDePago } from './pagos/MedioDePago'
import { RelojDelSistema, type Reloj } from './reloj'
import type { TarjetaMiLlave } from './TarjetaMiLlave'
import { formatearPesos, validarMonto } from './validaciones'

export interface ConfiguracionDeRecargas {
  minimo: number
  maximo: number
  /** Saldo máximo que puede tener una tarjeta después de recargar. */
  saldoMaximo: number
}

export interface ComprobanteDeRecarga {
  numero: string
  fecha: Date
  numeroTarjeta: string
  titular: string
  medioDePago: string
  monto: number
  saldoAnterior: number
  saldoNuevo: number
}

/** Orquesta una recarga: valida límites, cobra con el medio de pago y abona a la tarjeta. */
export class ProcesadorDeRecargas {
  readonly configuracion: ConfiguracionDeRecargas
  readonly #reloj: Reloj

  constructor(configuracion: ConfiguracionDeRecargas, reloj: Reloj = new RelojDelSistema()) {
    this.configuracion = configuracion
    this.#reloj = reloj
  }

  recargar(tarjeta: TarjetaMiLlave, monto: number, medio: MedioDePago): ComprobanteDeRecarga {
    const { minimo, maximo, saldoMaximo } = this.configuracion
    tarjeta.asegurarActiva()
    validarMonto(monto)
    if (monto < minimo || monto > maximo) {
      throw new MontoInvalidoError(
        `El valor de la recarga debe estar entre ${formatearPesos(minimo)} y ${formatearPesos(maximo)}.`,
      )
    }
    if (tarjeta.saldo + monto > saldoMaximo) {
      throw new MontoInvalidoError(
        `El saldo de la tarjeta no puede superar ${formatearPesos(saldoMaximo)} después de recargar.`,
      )
    }

    const fecha = this.#reloj.ahora()
    const saldoAnterior = tarjeta.saldo
    // Primero se cobra: si el medio rechaza, la tarjeta queda intacta.
    const autorizacion = medio.autorizar(monto, fecha)
    tarjeta.registrarRecarga(monto, autorizacion.medio, autorizacion.referencia, fecha)

    return {
      numero: autorizacion.referencia,
      fecha,
      numeroTarjeta: tarjeta.numero,
      titular: tarjeta.titular.nombreCompleto,
      medioDePago: autorizacion.medio,
      monto,
      saldoAnterior,
      saldoNuevo: tarjeta.saldo,
    }
  }
}
