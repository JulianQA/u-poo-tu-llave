import type { Viaje } from '../movimientos/Viaje'
import type { PuntoDeAcceso } from './PuntoDeAcceso'
import { ServicioDeTransporte } from './ServicioDeTransporte'

/** Buses duales: circulan por la troncal y por vías zonales, por eso atienden ambos tipos de punto. */
export class ServicioDual extends ServicioDeTransporte {
  get tipo() {
    return 'dual' as const
  }

  admite(punto: PuntoDeAcceso): boolean {
    return punto.tipo === 'estacion' || punto.tipo === 'paradero'
  }

  /** Encadenar dos duales no es transbordo. */
  protected override admiteTransbordoDesde(anterior: Viaje): boolean {
    return anterior.tipoServicio !== 'dual'
  }
}
