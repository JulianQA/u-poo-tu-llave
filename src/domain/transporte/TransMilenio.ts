import type { Viaje } from '../movimientos/Viaje'
import type { PuntoDeAcceso } from './PuntoDeAcceso'
import { ServicioDeTransporte } from './ServicioDeTransporte'

/** Red troncal: se ingresa por estaciones con torniquete. */
export class TransMilenio extends ServicioDeTransporte {
  get tipo() {
    return 'troncal' as const
  }

  admite(punto: PuntoDeAcceso): boolean {
    return punto.tipo === 'estacion'
  }

  /** Salir y volver a entrar a la troncal se cobra completo: solo hay transbordo desde otro servicio. */
  protected override admiteTransbordoDesde(anterior: Viaje): boolean {
    return anterior.tipoServicio !== 'troncal'
  }
}
