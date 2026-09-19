import { describe, expect, it } from 'vitest'
import {
  DatosInvalidosError,
  MontoInvalidoError,
  PagoRechazadoError,
  PuntoNoAdmitidoError,
  SaldoInsuficienteError,
  TarjetaBloqueadaError,
} from './errores'
import { Lector } from './Lector'
import { Movimiento } from './movimientos/Movimiento'
import { Recarga } from './movimientos/Recarga'
import { Viaje } from './movimientos/Viaje'
import { MedioDePago } from './pagos/MedioDePago'
import { PSE } from './pagos/PSE'
import { PuntoDeRecarga } from './pagos/PuntoDeRecarga'
import { TarjetaBancaria } from './pagos/TarjetaBancaria'
import { ProcesadorDeRecargas } from './ProcesadorDeRecargas'
import type { Reloj } from './reloj'
import { Titular } from './Titular'
import { Estacion, Paradero } from './transporte/PuntoDeAcceso'
import { ServicioDual } from './transporte/ServicioDual'
import { SitpZonal } from './transporte/SitpZonal'
import { TablaDeTarifas } from './transporte/Tarifa'
import { TransMilenio } from './transporte/TransMilenio'

/** Reloj controlable: permite probar reglas que dependen del tiempo. */
class RelojFijo implements Reloj {
  #ahora: Date

  constructor(inicio: string) {
    this.#ahora = new Date(inicio)
  }

  ahora(): Date {
    return new Date(this.#ahora)
  }

  avanzarMinutos(minutos: number): void {
    this.#ahora = new Date(this.#ahora.getTime() + minutos * 60_000)
  }
}

const NUMERO = '1234567890123456'
const CONFIG_RECARGAS = { minimo: 3000, maximo: 200_000, saldoMaximo: 500_000 }

function crearEscenario(saldoInicial = 0) {
  const reloj = new RelojFijo('2026-03-10T08:00:00')
  const tarifas = new TablaDeTarifas(
    { troncal: 3000, zonal: 3000, dual: 3000 },
    { tarifa: 200, ventanaMinutos: 75, maximoTransbordos: 2 },
  )
  const titular = new Titular({ id: 't1', nombres: 'Ana', apellidos: 'Pérez', documento: '1001' })
  const tarjeta = titular.emitirTarjeta(NUMERO, saldoInicial)
  const transMilenio = new TransMilenio('TransMilenio', tarifas)
  const zonal = new SitpZonal('SITP zonal', tarifas)
  const dual = new ServicioDual('SITP dual', tarifas)
  const portalNorte = new Estacion('portal-norte', 'Portal Norte')
  const calle100 = new Estacion('calle-100', 'Calle 100')
  const paradero = new Paradero('p-1', 'Cra 7 con Calle 45')
  const recargas = new ProcesadorDeRecargas(CONFIG_RECARGAS, reloj)
  return { reloj, tarifas, titular, tarjeta, transMilenio, zonal, dual, portalNorte, calle100, paradero, recargas }
}

describe('TarjetaMiLlave', () => {
  it('nace activa, con el saldo inicial y sin movimientos', () => {
    const { tarjeta, titular } = crearEscenario(5000)
    expect(tarjeta.estado).toBe('activa')
    expect(tarjeta.saldo).toBe(5000)
    expect(tarjeta.historial.movimientos).toHaveLength(0)
    expect(titular.tarjetas).toEqual([tarjeta])
  })

  it('rechaza números que no tienen 16 dígitos', () => {
    const { titular } = crearEscenario()
    expect(() => titular.emitirTarjeta('123')).toThrow(DatosInvalidosError)
  })

  it('no deja registrar dos veces el mismo número al mismo titular', () => {
    const { titular } = crearEscenario()
    expect(() => titular.emitirTarjeta(NUMERO)).toThrow(DatosInvalidosError)
  })

  it('encapsula el saldo: solo cambia mediante recargas y viajes', () => {
    const { tarjeta } = crearEscenario(1000)
    expect(() => {
      // @ts-expect-error el saldo es de solo lectura desde afuera
      tarjeta.saldo = 999_999
    }).toThrow(TypeError)
    expect(tarjeta.saldo).toBe(1000)
  })

  it('bloquea y reactiva', () => {
    const { tarjeta } = crearEscenario()
    tarjeta.bloquear()
    expect(tarjeta.estado).toBe('bloqueada')
    tarjeta.activar()
    expect(tarjeta.estaActiva).toBe(true)
  })
})

describe('Movimiento (herencia y polimorfismo)', () => {
  it('Recarga y Viaje son Movimientos con efecto de signo contrario sobre el saldo', () => {
    const { tarjeta, reloj, transMilenio, portalNorte } = crearEscenario()
    const movimientos: Movimiento[] = [
      tarjeta.registrarRecarga(10_000, 'Efectivo en Éxito', 'REF-1', reloj.ahora()),
      new Lector(transMilenio, portalNorte, reloj).validar(tarjeta),
    ]
    expect(movimientos.map((m) => m.tipo)).toEqual(['recarga', 'viaje'])
    expect(movimientos.map((m) => m.efectoEnSaldo)).toEqual([10_000, -3000])
    expect(movimientos[0]).toBeInstanceOf(Recarga)
    expect(movimientos[1]).toBeInstanceOf(Viaje)
    expect(movimientos[1].saldoResultante).toBe(7000)
  })
})

describe('Medios de pago (polimorfismo)', () => {
  const ahora = new Date('2026-03-10T08:00:00')

  it('cada medio aplica sus propias reglas a través de la misma interfaz', () => {
    const medios: MedioDePago[] = [
      new PuntoDeRecarga('Éxito Calle 80'),
      new PSE('Bancolombia', 'ana@correo.com'),
      new TarjetaBancaria({ tipoTarjeta: 'debito', numero: '4111 1111 1111 1111', mes: 12, anio: 2030, cvv: '123' }),
    ]
    for (const medio of medios) {
      const autorizacion = medio.autorizar(10_000, ahora)
      expect(autorizacion.monto).toBe(10_000)
      expect(autorizacion.medio).toBe(medio.nombre)
      expect(autorizacion.referencia).toMatch(new RegExp(`^${medio.tipo.toUpperCase()}-`))
    }
    expect(medios.map((m) => m.nombre)).toEqual([
      'Efectivo en Éxito Calle 80',
      'PSE (Bancolombia)',
      'Tarjeta débito terminada en 1111',
    ])
  })

  it('el efectivo solo acepta múltiplos de $1.000', () => {
    expect(() => new PuntoDeRecarga('Éxito').autorizar(3500, ahora)).toThrow(PagoRechazadoError)
  })

  it('PSE rechaza un correo inválido', () => {
    expect(() => new PSE('Davivienda', 'no-es-correo').autorizar(5000, ahora)).toThrow(PagoRechazadoError)
  })

  it('la tarjeta bancaria rechaza número inválido, vencida o CVV incorrecto', () => {
    const base = { tipoTarjeta: 'credito', numero: '4111111111111111', mes: 12, anio: 2030, cvv: '123' } as const
    expect(() => new TarjetaBancaria({ ...base, numero: '4111111111111112' }).autorizar(5000, ahora)).toThrow(
      /número/,
    )
    expect(() => new TarjetaBancaria({ ...base, anio: 2025 }).autorizar(5000, ahora)).toThrow(/vencida/)
    expect(() => new TarjetaBancaria({ ...base, cvv: '1' }).autorizar(5000, ahora)).toThrow(/CVV/)
  })

  it('cualquier medio rechaza montos inválidos', () => {
    expect(() => new PuntoDeRecarga('Éxito').autorizar(-1000, ahora)).toThrow(MontoInvalidoError)
  })
})

describe('ProcesadorDeRecargas', () => {
  it('abona el saldo, registra la recarga y devuelve el comprobante', () => {
    const { tarjeta, recargas } = crearEscenario(2000)
    const comprobante = recargas.recargar(tarjeta, 20_000, new PuntoDeRecarga('Éxito'))
    expect(tarjeta.saldo).toBe(22_000)
    expect(comprobante).toMatchObject({
      numeroTarjeta: NUMERO,
      titular: 'Ana Pérez',
      monto: 20_000,
      saldoAnterior: 2000,
      saldoNuevo: 22_000,
    })
    const [recarga] = tarjeta.historial.movimientos
    expect(recarga).toBeInstanceOf(Recarga)
    expect((recarga as Recarga).referencia).toBe(comprobante.numero)
  })

  it('respeta el mínimo, el máximo y el saldo máximo configurados', () => {
    const { tarjeta, recargas } = crearEscenario(400_000)
    const efectivo = new PuntoDeRecarga('Éxito')
    expect(() => recargas.recargar(tarjeta, 1000, efectivo)).toThrow(MontoInvalidoError)
    expect(() => recargas.recargar(tarjeta, 250_000, efectivo)).toThrow(MontoInvalidoError)
    expect(() => recargas.recargar(tarjeta, 150_000, efectivo)).toThrow(/no puede superar/)
    expect(tarjeta.saldo).toBe(400_000)
  })

  it('si el medio de pago rechaza, la tarjeta queda intacta', () => {
    const { tarjeta, recargas } = crearEscenario()
    expect(() => recargas.recargar(tarjeta, 5500, new PuntoDeRecarga('Éxito'))).toThrow(PagoRechazadoError)
    expect(tarjeta.saldo).toBe(0)
    expect(tarjeta.historial.movimientos).toHaveLength(0)
  })

  it('no recarga una tarjeta bloqueada ni cobra al medio', () => {
    const { tarjeta, recargas } = crearEscenario()
    tarjeta.bloquear()
    expect(() => recargas.recargar(tarjeta, 5000, new PuntoDeRecarga('Éxito'))).toThrow(TarjetaBloqueadaError)
  })

  it('rechaza montos no enteros', () => {
    const { tarjeta, recargas } = crearEscenario()
    expect(() => recargas.recargar(tarjeta, 5000.5, new PuntoDeRecarga('Éxito'))).toThrow(MontoInvalidoError)
  })
})

describe('Lector', () => {
  it('descuenta la tarifa y registra el viaje', () => {
    const { tarjeta, reloj, transMilenio, portalNorte } = crearEscenario(10_000)
    const viaje = new Lector(transMilenio, portalNorte, reloj).validar(tarjeta)
    expect(tarjeta.saldo).toBe(7000)
    expect(viaje).toMatchObject({ monto: 3000, servicio: 'TransMilenio', punto: 'Portal Norte', numeroTransbordo: 0 })
  })

  it('lanza SaldoInsuficienteError sin modificar la tarjeta', () => {
    const { tarjeta, reloj, transMilenio, portalNorte } = crearEscenario(2000)
    expect(() => new Lector(transMilenio, portalNorte, reloj).validar(tarjeta)).toThrow(SaldoInsuficienteError)
    expect(tarjeta.saldo).toBe(2000)
    expect(tarjeta.historial.movimientos).toHaveLength(0)
  })

  it('lanza TarjetaBloqueadaError si la tarjeta está bloqueada', () => {
    const { tarjeta, reloj, transMilenio, portalNorte } = crearEscenario(10_000)
    tarjeta.bloquear()
    expect(() => new Lector(transMilenio, portalNorte, reloj).validar(tarjeta)).toThrow(TarjetaBloqueadaError)
  })

  it('no se puede instalar un lector en un punto que el servicio no atiende', () => {
    const { reloj, transMilenio, zonal, portalNorte, paradero } = crearEscenario()
    expect(() => new Lector(transMilenio, paradero, reloj)).toThrow(PuntoNoAdmitidoError)
    expect(() => new Lector(zonal, portalNorte, reloj)).toThrow(PuntoNoAdmitidoError)
  })

  it('el servicio dual atiende estaciones y paraderos', () => {
    const { reloj, dual, portalNorte, paradero } = crearEscenario()
    expect(() => new Lector(dual, portalNorte, reloj)).not.toThrow()
    expect(() => new Lector(dual, paradero, reloj)).not.toThrow()
  })

  it('leer no cobra: solo devuelve saldo, estado y últimos movimientos', () => {
    const { tarjeta, reloj, transMilenio, portalNorte } = crearEscenario(10_000)
    const lector = new Lector(transMilenio, portalNorte, reloj)
    lector.validar(tarjeta)
    const lectura = lector.leer(tarjeta)
    expect(lectura).toMatchObject({ numero: NUMERO, titular: 'Ana Pérez', estado: 'activa', saldo: 7000 })
    expect(lectura.ultimosMovimientos).toHaveLength(1)
  })
})

describe('Tarifas y transbordos', () => {
  it('las tarifas son configurables y se actualizan en todos los servicios', () => {
    const { tarjeta, reloj, tarifas, transMilenio, portalNorte } = crearEscenario(10_000)
    tarifas.establecer('troncal', 3500)
    const viaje = new Lector(transMilenio, portalNorte, reloj).validar(tarjeta)
    expect(viaje.monto).toBe(3500)
  })

  it('cobra tarifa de transbordo al pasar de zonal a troncal dentro de la ventana', () => {
    const { tarjeta, reloj, transMilenio, zonal, portalNorte, paradero } = crearEscenario(20_000)
    new Lector(zonal, paradero, reloj).validar(tarjeta)
    reloj.avanzarMinutos(30)
    const segundo = new Lector(transMilenio, portalNorte, reloj).validar(tarjeta)
    expect(segundo).toMatchObject({ monto: 200, numeroTransbordo: 1, esTransbordo: true })
  })

  it('pasada la ventana de 75 minutos se cobra el pasaje completo', () => {
    const { tarjeta, reloj, transMilenio, zonal, portalNorte, paradero } = crearEscenario(20_000)
    new Lector(zonal, paradero, reloj).validar(tarjeta)
    reloj.avanzarMinutos(76)
    const segundo = new Lector(transMilenio, portalNorte, reloj).validar(tarjeta)
    expect(segundo).toMatchObject({ monto: 3000, numeroTransbordo: 0 })
  })

  it('TransMilenio no da transbordo entre estaciones de la troncal', () => {
    const { tarjeta, reloj, transMilenio, portalNorte, calle100 } = crearEscenario(20_000)
    new Lector(transMilenio, portalNorte, reloj).validar(tarjeta)
    reloj.avanzarMinutos(10)
    const segundo = new Lector(transMilenio, calle100, reloj).validar(tarjeta)
    expect(segundo.numeroTransbordo).toBe(0)
    expect(segundo.monto).toBe(3000)
  })

  it('el SITP zonal sí da transbordo entre rutas zonales, hasta el máximo configurado', () => {
    const { tarjeta, reloj, zonal } = crearEscenario(30_000)
    const paraderos = ['A', 'B', 'C', 'D'].map((n) => new Paradero(`p-${n}`, `Paradero ${n}`))
    const viajes = paraderos.map((p) => {
      const viaje = new Lector(zonal, p, reloj).validar(tarjeta)
      reloj.avanzarMinutos(10)
      return viaje
    })
    // pasaje completo, 2 transbordos, y el tercero ya supera el máximo: vuelve a cobrarse completo
    expect(viajes.map((v) => [v.numeroTransbordo, v.monto])).toEqual([
      [0, 3000],
      [1, 200],
      [2, 200],
      [0, 3000],
    ])
  })

  it('no hay transbordo si se vuelve a validar en el mismo punto', () => {
    const { tarjeta, reloj, zonal, paradero } = crearEscenario(20_000)
    const lector = new Lector(zonal, paradero, reloj)
    lector.validar(tarjeta)
    reloj.avanzarMinutos(5)
    expect(lector.validar(tarjeta).numeroTransbordo).toBe(0)
  })
})

describe('HistorialDeMovimientos', () => {
  it('ordena por fecha, filtra por tipo y por rango, y totaliza', () => {
    const { tarjeta, reloj, transMilenio, portalNorte } = crearEscenario()
    tarjeta.registrarRecarga(20_000, 'Efectivo', 'R1', reloj.ahora())
    reloj.avanzarMinutos(60 * 24)
    new Lector(transMilenio, portalNorte, reloj).validar(tarjeta)
    reloj.avanzarMinutos(60 * 24)
    tarjeta.registrarRecarga(10_000, 'PSE', 'R2', reloj.ahora())

    const historial = tarjeta.historial
    expect(historial.ordenadoPorFecha().movimientos.map((m) => m.tipo)).toEqual(['recarga', 'viaje', 'recarga'])
    expect(historial.filtrar({ tipo: 'recarga' }).movimientos).toHaveLength(2)
    expect(historial.filtrar({ desde: new Date('2026-03-11T00:00:00') }).movimientos).toHaveLength(2)
    expect(historial.ultimos(1).movimientos[0].tipo).toBe('recarga')
    expect(historial.totalRecargado).toBe(30_000)
    expect(historial.totalGastado).toBe(3000)
  })
})
