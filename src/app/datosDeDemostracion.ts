import type { RepositorioDeTitulares } from '@/domain/RepositorioDeTitulares'
import type { Reloj } from '@/domain/reloj'
import { Titular } from '@/domain/Titular'
import type { TipoServicio } from '@/domain/transporte/ServicioDeTransporte'

/** Números de las tarjetas de demostración, visibles como accesos rápidos en la interfaz. */
export const TARJETA_DEMO_ACTIVA = '1000123456789012'
export const TARJETA_DEMO_BLOQUEADA = '1000987654321098'

function hace(reloj: Reloj, dias: number, hora: number, minuto = 0): Date {
  const fecha = reloj.ahora()
  fecha.setDate(fecha.getDate() - dias)
  fecha.setHours(hora, minuto, 0, 0)
  return fecha
}

/** Crea titulares con historial realista usando la API pública del dominio (nada se inserta "a mano"). */
export function sembrarDatosDeDemostracion(repositorio: RepositorioDeTitulares, reloj: Reloj): void {
  if (repositorio.listar().length > 0) return

  const camila = new Titular({ id: 'demo-1', nombres: 'Camila', apellidos: 'Rojas Pineda', documento: '1020304050' })
  const activa = camila.emitirTarjeta(TARJETA_DEMO_ACTIVA)
  const viaje = (tipoServicio: TipoServicio, servicio: string, punto: string, tarifa: number, transbordo: number, fecha: Date) =>
    ({ servicio, tipoServicio, punto, tarifa, numeroTransbordo: transbordo, fecha })

  activa.registrarRecarga(30_000, 'Efectivo en Éxito Calle 80', 'EFECTIVO-8F21A3C4', hace(reloj, 9, 17, 40))
  activa.registrarViaje(viaje('troncal', 'TransMilenio', 'Portal Norte', 3550, 0, hace(reloj, 8, 6, 45)))
  activa.registrarViaje(viaje('troncal', 'TransMilenio', 'Museo del Oro', 3550, 0, hace(reloj, 8, 17, 30)))
  activa.registrarViaje(viaje('zonal', 'SITP zonal', 'Carrera 7 con Calle 45', 3550, 0, hace(reloj, 6, 7, 10)))
  activa.registrarViaje(viaje('troncal', 'TransMilenio', 'Calle 72', 200, 1, hace(reloj, 6, 7, 55)))
  activa.registrarRecarga(10_000, 'PSE (Bancolombia)', 'PSE-19C7D0B2', hace(reloj, 4, 21, 5))
  activa.registrarViaje(viaje('troncal', 'TransMilenio', 'Héroes', 3550, 0, hace(reloj, 2, 6, 50)))
  activa.registrarViaje(viaje('zonal', 'SITP zonal', 'Av. Boyacá con Calle 80', 3550, 0, hace(reloj, 1, 18, 15)))
  repositorio.guardar(camila)

  const andres = new Titular({ id: 'demo-2', nombres: 'Andrés', apellidos: 'Mejía Correa', documento: '80123456' })
  const bloqueada = andres.emitirTarjeta(TARJETA_DEMO_BLOQUEADA)
  bloqueada.registrarRecarga(5000, 'Efectivo en Estación Portal Norte', 'EFECTIVO-77B0E9D1', hace(reloj, 12, 8, 0))
  bloqueada.registrarViaje(viaje('troncal', 'TransMilenio', 'Portal Sur', 3550, 0, hace(reloj, 12, 8, 20)))
  bloqueada.bloquear()
  repositorio.guardar(andres)
}
