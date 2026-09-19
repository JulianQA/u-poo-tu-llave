import type { Titular } from '@/domain/Titular'
import { RepositorioEnMemoria } from './RepositorioEnMemoria'
import { titularADTO, titularDesdeDTO, VERSION_DEL_ESQUEMA, type SnapshotDTO } from './serializacion'

/** Subconjunto de `Storage` que necesitamos; permite inyectar uno falso en pruebas. */
export interface Almacenamiento {
  getItem(clave: string): string | null
  setItem(clave: string, valor: string): void
}

/**
 * Persistencia en JSON dentro de `localStorage`. Reutiliza el repositorio en memoria
 * y solo agrega la lectura inicial y la escritura tras cada cambio.
 */
export class RepositorioLocalStorage extends RepositorioEnMemoria {
  readonly #almacenamiento: Almacenamiento
  readonly #clave: string

  constructor(almacenamiento: Almacenamiento, clave = `tu-llave:v${VERSION_DEL_ESQUEMA}`) {
    super()
    this.#almacenamiento = almacenamiento
    this.#clave = clave
    this.#cargar()
  }

  override guardar(titular: Titular): void {
    super.guardar(titular)
    const snapshot: SnapshotDTO = {
      version: VERSION_DEL_ESQUEMA,
      titulares: this.listar().map(titularADTO),
    }
    try {
      this.#almacenamiento.setItem(this.#clave, JSON.stringify(snapshot))
    } catch {
      // Almacenamiento lleno o bloqueado: el simulador sigue funcionando en memoria.
    }
  }

  #cargar(): void {
    try {
      const crudo = this.#almacenamiento.getItem(this.#clave)
      if (crudo === null) return
      const snapshot = JSON.parse(crudo) as SnapshotDTO
      if (snapshot.version !== VERSION_DEL_ESQUEMA) return
      for (const dto of snapshot.titulares) {
        const titular = titularDesdeDTO(dto)
        this.titulares.set(titular.id, titular)
      }
    } catch {
      // JSON corrupto o incompatible: se arranca vacío y el sembrado crea los datos de demostración.
      this.titulares.clear()
    }
  }
}
