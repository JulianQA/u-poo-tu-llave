import type { RepositorioDeTitulares } from '@/domain/RepositorioDeTitulares'
import type { TarjetaMiLlave } from '@/domain/TarjetaMiLlave'
import type { Titular } from '@/domain/Titular'

/** Guarda los titulares en un `Map`. Se pierde al recargar la página; sirve también para pruebas. */
export class RepositorioEnMemoria implements RepositorioDeTitulares {
  protected readonly titulares = new Map<string, Titular>()

  guardar(titular: Titular): void {
    this.titulares.set(titular.id, titular)
  }

  listar(): readonly Titular[] {
    return [...this.titulares.values()]
  }

  buscarTarjeta(numero: string): TarjetaMiLlave | undefined {
    for (const titular of this.titulares.values()) {
      const tarjeta = titular.tarjetas.find((t) => t.numero === numero)
      if (tarjeta !== undefined) return tarjeta
    }
    return undefined
  }
}
