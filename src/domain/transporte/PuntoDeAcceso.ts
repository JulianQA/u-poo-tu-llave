import { validarTextoNoVacio } from '../validaciones'

export type TipoPunto = 'estacion' | 'paradero'

/** Lugar físico donde se acerca la tarjeta al validador. */
export abstract class PuntoDeAcceso {
  readonly id: string
  readonly nombre: string

  constructor(id: string, nombre: string) {
    this.id = validarTextoNoVacio(id, 'El identificador del punto')
    this.nombre = validarTextoNoVacio(nombre, 'El nombre del punto')
  }

  abstract get tipo(): TipoPunto
}

/** Estación de la red troncal (torniquete). */
export class Estacion extends PuntoDeAcceso {
  get tipo() {
    return 'estacion' as const
  }
}

/** Paradero de una ruta zonal (validador a bordo del bus). */
export class Paradero extends PuntoDeAcceso {
  get tipo() {
    return 'paradero' as const
  }
}
