import { DatosInvalidosError } from '../errores'
import type { Viaje } from '../movimientos/Viaje'
import type { TipoServicio } from './ServicioDeTransporte'

/** Valor en pesos de un pasaje. Puede ser 0 (transbordo gratuito). */
export class Tarifa {
  readonly valor: number

  constructor(valor: number) {
    if (!Number.isInteger(valor) || valor < 0) {
      throw new DatosInvalidosError('Una tarifa debe ser un entero de pesos mayor o igual que cero.')
    }
    this.valor = valor
  }
}

export interface ConfiguracionDeTransbordo {
  tarifa: number
  ventanaMinutos: number
  maximoTransbordos: number
}

/** Decide cuándo un viaje cuenta como transbordo del anterior. */
export class ReglaDeTransbordo {
  readonly tarifa: Tarifa
  readonly ventanaMinutos: number
  readonly maximoTransbordos: number

  constructor(config: ConfiguracionDeTransbordo) {
    this.tarifa = new Tarifa(config.tarifa)
    this.ventanaMinutos = config.ventanaMinutos
    this.maximoTransbordos = config.maximoTransbordos
  }

  /**
   * Número de transbordo que le correspondería a un viaje nuevo (0 = pasaje completo).
   * Aplica si el último viaje fue dentro de la ventana, en otro punto, y no se superó el máximo.
   */
  numeroDeTransbordo(ultimoViaje: Viaje | undefined, nombreDelPunto: string, ahora: Date): number {
    if (ultimoViaje === undefined) return 0
    const minutos = (ahora.getTime() - ultimoViaje.fecha.getTime()) / 60_000
    const dentroDeLaVentana = minutos >= 0 && minutos <= this.ventanaMinutos
    const puntoDistinto = ultimoViaje.punto !== nombreDelPunto
    const quedanTransbordos = ultimoViaje.numeroTransbordo < this.maximoTransbordos
    return dentroDeLaVentana && puntoDistinto && quedanTransbordos ? ultimoViaje.numeroTransbordo + 1 : 0
  }
}

/**
 * Tarifas vigentes. Se inyecta la misma instancia a todos los servicios,
 * así que cambiar un valor con `establecer` se refleja de inmediato en todos.
 */
export class TablaDeTarifas {
  readonly #porServicio = new Map<TipoServicio, Tarifa>()
  readonly transbordo: ReglaDeTransbordo

  constructor(valores: Record<TipoServicio, number>, transbordo: ConfiguracionDeTransbordo) {
    for (const [tipo, valor] of Object.entries(valores) as [TipoServicio, number][]) {
      this.#porServicio.set(tipo, new Tarifa(valor))
    }
    this.transbordo = new ReglaDeTransbordo(transbordo)
  }

  tarifaDe(tipo: TipoServicio): Tarifa {
    const tarifa = this.#porServicio.get(tipo)
    if (tarifa === undefined) throw new DatosInvalidosError(`No hay tarifa configurada para el servicio ${tipo}.`)
    return tarifa
  }

  establecer(tipo: TipoServicio, valor: number): void {
    this.#porServicio.set(tipo, new Tarifa(valor))
  }
}
