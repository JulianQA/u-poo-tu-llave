import { PuntoNoAdmitidoError } from './errores'
import type { Movimiento } from './movimientos/Movimiento'
import type { Viaje } from './movimientos/Viaje'
import { RelojDelSistema, type Reloj } from './reloj'
import type { EstadoTarjeta, TarjetaMiLlave } from './TarjetaMiLlave'
import type { PuntoDeAcceso } from './transporte/PuntoDeAcceso'
import type { ServicioDeTransporte } from './transporte/ServicioDeTransporte'

export interface LecturaDeTarjeta {
  numero: string
  titular: string
  estado: EstadoTarjeta
  saldo: number
  ultimosMovimientos: readonly Movimiento[]
}

/** Foto de solo lectura de la tarjeta: lo que muestra un validador al acercarla, sin cobrar. */
export function leerTarjeta(tarjeta: TarjetaMiLlave, cantidadDeMovimientos = 5): LecturaDeTarjeta {
  return {
    numero: tarjeta.numero,
    titular: tarjeta.titular.nombreCompleto,
    estado: tarjeta.estado,
    saldo: tarjeta.saldo,
    ultimosMovimientos: tarjeta.historial.ultimos(cantidadDeMovimientos).movimientos,
  }
}

/**
 * Torniquete o validador de un servicio en un punto concreto.
 * Al acercar la tarjeta (`validar`) lee, valida las reglas, descuenta la tarifa y registra el viaje.
 */
export class Lector {
  readonly servicio: ServicioDeTransporte
  readonly punto: PuntoDeAcceso
  readonly #reloj: Reloj

  constructor(servicio: ServicioDeTransporte, punto: PuntoDeAcceso, reloj: Reloj = new RelojDelSistema()) {
    if (!servicio.admite(punto)) {
      throw new PuntoNoAdmitidoError(`${servicio.nombre} no opera en ${punto.nombre}.`)
    }
    this.servicio = servicio
    this.punto = punto
    this.#reloj = reloj
  }

  leer(tarjeta: TarjetaMiLlave): LecturaDeTarjeta {
    return leerTarjeta(tarjeta)
  }

  /**
   * @throws TarjetaBloqueadaError si la tarjeta está bloqueada.
   * @throws SaldoInsuficienteError si no alcanza para la tarifa.
   */
  validar(tarjeta: TarjetaMiLlave): Viaje {
    tarjeta.asegurarActiva()
    const fecha = this.#reloj.ahora()
    const { valor, numeroTransbordo } = this.servicio.calcularTarifa({
      punto: this.punto,
      fecha,
      ultimoViaje: tarjeta.ultimoViaje,
    })
    return tarjeta.registrarViaje({
      servicio: this.servicio.nombre,
      tipoServicio: this.servicio.tipo,
      punto: this.punto.nombre,
      tarifa: valor,
      numeroTransbordo,
      fecha,
    })
  }
}
