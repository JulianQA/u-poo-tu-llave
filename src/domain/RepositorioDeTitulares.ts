import type { TarjetaMiLlave } from './TarjetaMiLlave'
import type { Titular } from './Titular'

/**
 * Puerto de persistencia: el dominio solo conoce esta interfaz.
 * Las implementaciones (memoria, localStorage, una API…) viven en `infrastructure/`.
 */
export interface RepositorioDeTitulares {
  guardar(titular: Titular): void
  listar(): readonly Titular[]
  buscarTarjeta(numero: string): TarjetaMiLlave | undefined
}
