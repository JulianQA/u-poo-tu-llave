import { describe, expect, it } from 'vitest'
import { SaldoInsuficienteError, TarjetaBloqueadaError, TarjetaNoEncontradaError } from '@/domain/errores'
import { PuntoDeRecarga } from '@/domain/pagos/PuntoDeRecarga'
import { ProcesadorDeRecargas } from '@/domain/ProcesadorDeRecargas'
import { RelojDelSistema } from '@/domain/reloj'
import { Estacion, Paradero } from '@/domain/transporte/PuntoDeAcceso'
import { SitpZonal } from '@/domain/transporte/SitpZonal'
import { TablaDeTarifas } from '@/domain/transporte/Tarifa'
import { TransMilenio } from '@/domain/transporte/TransMilenio'
import { RepositorioEnMemoria } from '@/infrastructure/RepositorioEnMemoria'
import { RepositorioLocalStorage, type Almacenamiento } from '@/infrastructure/RepositorioLocalStorage'
import { sembrarDatosDeDemostracion, TARJETA_DEMO_ACTIVA, TARJETA_DEMO_BLOQUEADA } from './datosDeDemostracion'
import { MiLlaveApp } from './MiLlaveApp'

class AlmacenamientoFalso implements Almacenamiento {
  datos = new Map<string, string>()
  getItem(clave: string) {
    return this.datos.get(clave) ?? null
  }
  setItem(clave: string, valor: string) {
    this.datos.set(clave, valor)
  }
}

function crearApp(repositorio = new RepositorioEnMemoria()) {
  const reloj = new RelojDelSistema()
  const tarifas = new TablaDeTarifas(
    { troncal: 3550, zonal: 3550, dual: 3550 },
    { tarifa: 200, ventanaMinutos: 75, maximoTransbordos: 2 },
  )
  sembrarDatosDeDemostracion(repositorio, reloj)
  return new MiLlaveApp({
    repositorio,
    reloj,
    servicios: [new TransMilenio('TransMilenio', tarifas), new SitpZonal('SITP zonal', tarifas)],
    puntos: [new Estacion('portal-norte', 'Portal Norte'), new Paradero('p-1', 'Carrera 7 con Calle 45')],
    recargas: new ProcesadorDeRecargas({ minimo: 3000, maximo: 200_000, saldoMaximo: 500_000 }, reloj),
  })
}

describe('MiLlaveApp', () => {
  it('lee una tarjeta de demostración con su historial', () => {
    const lectura = crearApp().leer(TARJETA_DEMO_ACTIVA)
    expect(lectura.estado).toBe('activa')
    expect(lectura.saldo).toBeGreaterThan(0)
    expect(lectura.ultimosMovimientos).toHaveLength(5)
  })

  it('acepta el número con espacios y falla con uno desconocido', () => {
    const app = crearApp()
    expect(app.leer('1000 1234 5678 9012').numero).toBe(TARJETA_DEMO_ACTIVA)
    expect(() => app.leer('0000000000000000')).toThrow(TarjetaNoEncontradaError)
  })

  it('recarga, viaja y avisa a los suscriptores', () => {
    const app = crearApp()
    let avisos = 0
    app.suscribir(() => avisos++)
    const antes = app.obtenerTarjeta(TARJETA_DEMO_ACTIVA).saldo

    app.recargar(TARJETA_DEMO_ACTIVA, 10_000, new PuntoDeRecarga('Éxito'))
    app.viajar(TARJETA_DEMO_ACTIVA, 'troncal', 'portal-norte')

    expect(app.obtenerTarjeta(TARJETA_DEMO_ACTIVA).saldo).toBe(antes + 10_000 - 3550)
    expect(avisos).toBe(2)
    expect(app.obtenerVersion()).toBe(2)
  })

  it('la tarjeta bloqueada no puede viajar y al activarla sí, pero sin saldo suficiente falla', () => {
    const app = crearApp()
    expect(() => app.viajar(TARJETA_DEMO_BLOQUEADA, 'troncal', 'portal-norte')).toThrow(TarjetaBloqueadaError)
    app.activar(TARJETA_DEMO_BLOQUEADA)
    expect(() => app.viajar(TARJETA_DEMO_BLOQUEADA, 'troncal', 'portal-norte')).toThrow(SaldoInsuficienteError)
  })

  it('solo ofrece los puntos que cada servicio atiende', () => {
    const app = crearApp()
    expect(app.puntosDe('troncal').map((p) => p.nombre)).toEqual(['Portal Norte'])
    expect(app.puntosDe('zonal').map((p) => p.nombre)).toEqual(['Carrera 7 con Calle 45'])
  })
})

describe('Persistencia en JSON', () => {
  it('lo guardado se restaura igual: saldo, estado y tipos de movimiento', () => {
    const almacenamiento = new AlmacenamientoFalso()
    const app = crearApp(new RepositorioLocalStorage(almacenamiento))
    app.recargar(TARJETA_DEMO_ACTIVA, 20_000, new PuntoDeRecarga('Éxito'))
    const original = app.obtenerTarjeta(TARJETA_DEMO_ACTIVA)

    const restaurada = new RepositorioLocalStorage(almacenamiento).buscarTarjeta(TARJETA_DEMO_ACTIVA)
    expect(restaurada?.saldo).toBe(original.saldo)
    expect(restaurada?.estado).toBe('activa')
    expect(restaurada?.historial.movimientos.map((m) => m.constructor.name)).toEqual(
      original.historial.movimientos.map((m) => m.constructor.name),
    )
    expect(restaurada?.titular.nombreCompleto).toBe('Camila Rojas Pineda')
  })

  it('si el JSON está corrupto, arranca vacío en lugar de romperse', () => {
    const almacenamiento = new AlmacenamientoFalso()
    almacenamiento.setItem('tu-llave:v1', '{no es json')
    expect(new RepositorioLocalStorage(almacenamiento).listar()).toHaveLength(0)
  })
})
