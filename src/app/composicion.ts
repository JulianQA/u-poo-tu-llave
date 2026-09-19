import {
  ESTACIONES_TRONCALES,
  LIMITES_DE_RECARGA,
  PARADEROS_ZONALES,
  TARIFAS,
} from '@/config/miLlave.config'
import { ProcesadorDeRecargas } from '@/domain/ProcesadorDeRecargas'
import { RelojDelSistema } from '@/domain/reloj'
import { Estacion, Paradero } from '@/domain/transporte/PuntoDeAcceso'
import { ServicioDual } from '@/domain/transporte/ServicioDual'
import { SitpZonal } from '@/domain/transporte/SitpZonal'
import { TablaDeTarifas } from '@/domain/transporte/Tarifa'
import { TransMilenio } from '@/domain/transporte/TransMilenio'
import { RepositorioEnMemoria } from '@/infrastructure/RepositorioEnMemoria'
import { RepositorioLocalStorage } from '@/infrastructure/RepositorioLocalStorage'
import { sembrarDatosDeDemostracion } from './datosDeDemostracion'
import { MiLlaveApp } from './MiLlaveApp'

/** Punto único donde se eligen las implementaciones concretas y se conectan las piezas. */
export function crearMiLlaveApp(): MiLlaveApp {
  const reloj = new RelojDelSistema()
  const tarifas = new TablaDeTarifas({ ...TARIFAS.pasajes }, { ...TARIFAS.transbordo })

  const repositorio = obtenerRepositorio()
  sembrarDatosDeDemostracion(repositorio, reloj)

  return new MiLlaveApp({
    repositorio,
    reloj,
    servicios: [
      new TransMilenio('TransMilenio', tarifas),
      new SitpZonal('SITP zonal', tarifas),
      new ServicioDual('SITP dual', tarifas),
    ],
    puntos: [
      ...ESTACIONES_TRONCALES.map((e) => new Estacion(e.id, e.nombre)),
      ...PARADEROS_ZONALES.map((p) => new Paradero(p.id, p.nombre)),
    ],
    recargas: new ProcesadorDeRecargas({ ...LIMITES_DE_RECARGA }, reloj),
  })
}

function obtenerRepositorio() {
  try {
    return new RepositorioLocalStorage(window.localStorage)
  } catch {
    // localStorage no disponible (modo privado, política del navegador): se trabaja en memoria.
    return new RepositorioEnMemoria()
  }
}
