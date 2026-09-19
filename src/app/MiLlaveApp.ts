import { DatosInvalidosError, TarjetaNoEncontradaError } from '@/domain/errores'
import { Lector, leerTarjeta, type LecturaDeTarjeta } from '@/domain/Lector'
import type { Viaje } from '@/domain/movimientos/Viaje'
import type { MedioDePago } from '@/domain/pagos/MedioDePago'
import { ProcesadorDeRecargas, type ComprobanteDeRecarga } from '@/domain/ProcesadorDeRecargas'
import type { RepositorioDeTitulares } from '@/domain/RepositorioDeTitulares'
import type { Reloj } from '@/domain/reloj'
import type { TarjetaMiLlave } from '@/domain/TarjetaMiLlave'
import type { PuntoDeAcceso } from '@/domain/transporte/PuntoDeAcceso'
import type { ServicioDeTransporte, TipoServicio } from '@/domain/transporte/ServicioDeTransporte'

export interface DependenciasDeMiLlaveApp {
  repositorio: RepositorioDeTitulares
  servicios: readonly ServicioDeTransporte[]
  puntos: readonly PuntoDeAcceso[]
  recargas: ProcesadorDeRecargas
  reloj: Reloj
}

type Oyente = () => void

/**
 * Fachada de la aplicación: es lo único que la interfaz conoce del dominio.
 * Coordina repositorio, lectores y recargas, guarda tras cada cambio y avisa a quien escuche.
 * No importa React: la UI se suscribe con `suscribir` y lee `version` para saber cuándo redibujar.
 */
export class MiLlaveApp {
  readonly #deps: DependenciasDeMiLlaveApp
  readonly #oyentes = new Set<Oyente>()
  #version = 0

  constructor(deps: DependenciasDeMiLlaveApp) {
    this.#deps = deps
    this.suscribir = this.suscribir.bind(this)
    this.obtenerVersion = this.obtenerVersion.bind(this)
  }

  // --- Suscripción (compatible con useSyncExternalStore) ---

  suscribir(oyente: Oyente): () => void {
    this.#oyentes.add(oyente)
    return () => this.#oyentes.delete(oyente)
  }

  obtenerVersion(): number {
    return this.#version
  }

  // --- Catálogo ---

  get servicios(): readonly ServicioDeTransporte[] {
    return this.#deps.servicios
  }

  puntosDe(tipo: TipoServicio): readonly PuntoDeAcceso[] {
    const servicio = this.#servicio(tipo)
    return this.#deps.puntos.filter((p) => servicio.admite(p))
  }

  get limitesDeRecarga() {
    return this.#deps.recargas.configuracion
  }

  // --- Consultas ---

  /** Números de las tarjetas registradas, para los accesos rápidos de la demostración. */
  listarTarjetas(): readonly TarjetaMiLlave[] {
    return this.#deps.repositorio.listar().flatMap((t) => t.tarjetas)
  }

  obtenerTarjeta(numero: string): TarjetaMiLlave {
    const limpio = numero.replace(/\s+/g, '')
    const tarjeta = this.#deps.repositorio.buscarTarjeta(limpio)
    if (tarjeta === undefined) throw new TarjetaNoEncontradaError(limpio || numero)
    return tarjeta
  }

  /** "Acercar la tarjeta" a un lector de consulta: no cobra nada. */
  leer(numero: string): LecturaDeTarjeta {
    return leerTarjeta(this.obtenerTarjeta(numero))
  }

  // --- Operaciones (cada una guarda y notifica) ---

  recargar(numero: string, monto: number, medio: MedioDePago): ComprobanteDeRecarga {
    const tarjeta = this.obtenerTarjeta(numero)
    const comprobante = this.#deps.recargas.recargar(tarjeta, monto, medio)
    this.#persistir(tarjeta)
    return comprobante
  }

  viajar(numero: string, tipo: TipoServicio, idPunto: string): Viaje {
    const tarjeta = this.obtenerTarjeta(numero)
    const punto = this.#deps.puntos.find((p) => p.id === idPunto)
    if (punto === undefined) throw new DatosInvalidosError('Elige una estación o paradero.')
    const lector = new Lector(this.#servicio(tipo), punto, this.#deps.reloj)
    const viaje = lector.validar(tarjeta)
    this.#persistir(tarjeta)
    return viaje
  }

  bloquear(numero: string): void {
    const tarjeta = this.obtenerTarjeta(numero)
    tarjeta.bloquear()
    this.#persistir(tarjeta)
  }

  activar(numero: string): void {
    const tarjeta = this.obtenerTarjeta(numero)
    tarjeta.activar()
    this.#persistir(tarjeta)
  }

  // --- Internos ---

  #servicio(tipo: TipoServicio): ServicioDeTransporte {
    const servicio = this.#deps.servicios.find((s) => s.tipo === tipo)
    if (servicio === undefined) throw new DatosInvalidosError('Elige un servicio de transporte.')
    return servicio
  }

  #persistir(tarjeta: TarjetaMiLlave): void {
    this.#deps.repositorio.guardar(tarjeta.titular)
    this.#version++
    for (const oyente of this.#oyentes) oyente()
  }
}
