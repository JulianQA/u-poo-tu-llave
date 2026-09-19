import type { Viaje } from '../movimientos/Viaje'
import type { PuntoDeAcceso } from './PuntoDeAcceso'
import type { TablaDeTarifas } from './Tarifa'

export type TipoServicio = 'troncal' | 'zonal' | 'dual'

export interface ContextoDeViaje {
  punto: PuntoDeAcceso
  fecha: Date
  /** Último viaje registrado en la tarjeta, si existe. */
  ultimoViaje?: Viaje
}

export interface CalculoDeTarifa {
  valor: number
  numeroTransbordo: number
}

/**
 * Un servicio de transporte sabe qué puntos atiende y cuánto cobra.
 * `calcularTarifa` es un método plantilla: el flujo (¿es transbordo? ¿qué valor?) es común
 * y cada subclase personaliza los pasos que cambian (`admite`, `tarifaBase`, `admiteTransbordoDesde`).
 */
export abstract class ServicioDeTransporte {
  readonly nombre: string
  protected readonly tarifas: TablaDeTarifas

  constructor(nombre: string, tarifas: TablaDeTarifas) {
    this.nombre = nombre
    this.tarifas = tarifas
  }

  abstract get tipo(): TipoServicio

  /** ¿Este servicio opera en la estación o paradero indicado? */
  abstract admite(punto: PuntoDeAcceso): boolean

  /** Valor de un pasaje completo. */
  get tarifaBase(): number {
    return this.tarifas.tarifaDe(this.tipo).valor
  }

  /** Por defecto cualquier viaje anterior habilita transbordo. */
  protected admiteTransbordoDesde(_anterior: Viaje): boolean {
    return true
  }

  calcularTarifa(contexto: ContextoDeViaje): CalculoDeTarifa {
    const { punto, fecha, ultimoViaje } = contexto
    const numero = this.tarifas.transbordo.numeroDeTransbordo(ultimoViaje, punto.nombre, fecha)
    if (numero > 0 && ultimoViaje !== undefined && this.admiteTransbordoDesde(ultimoViaje)) {
      return { valor: this.tarifas.transbordo.tarifa.valor, numeroTransbordo: numero }
    }
    return { valor: this.tarifaBase, numeroTransbordo: 0 }
  }
}
