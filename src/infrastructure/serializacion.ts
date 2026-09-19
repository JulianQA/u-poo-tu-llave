import type { Movimiento } from '@/domain/movimientos/Movimiento'
import { Recarga } from '@/domain/movimientos/Recarga'
import { Viaje } from '@/domain/movimientos/Viaje'
import { TarjetaMiLlave, type EstadoTarjeta } from '@/domain/TarjetaMiLlave'
import { Titular } from '@/domain/Titular'
import type { TipoServicio } from '@/domain/transporte/ServicioDeTransporte'

/**
 * Formato JSON versionado de lo que se guarda. Es un contrato distinto del modelo de dominio:
 * si el dominio cambia, se sube la versión y se migra aquí, sin tocar las clases.
 */
export const VERSION_DEL_ESQUEMA = 1

interface MovimientoDTO {
  tipo: 'recarga' | 'viaje'
  id: string
  fecha: string
  monto: number
  saldoResultante: number
  // recarga
  medioDePago?: string
  referencia?: string
  // viaje
  servicio?: string
  tipoServicio?: TipoServicio
  punto?: string
  numeroTransbordo?: number
}

interface TarjetaDTO {
  numero: string
  estado: EstadoTarjeta
  saldo: number
  movimientos: MovimientoDTO[]
}

export interface TitularDTO {
  id: string
  nombres: string
  apellidos: string
  documento: string
  tarjetas: TarjetaDTO[]
}

export interface SnapshotDTO {
  version: number
  titulares: TitularDTO[]
}

function movimientoADTO(m: Movimiento): MovimientoDTO {
  const base = { id: m.id, fecha: m.fecha.toISOString(), monto: m.monto, saldoResultante: m.saldoResultante }
  if (m instanceof Recarga) {
    return { ...base, tipo: 'recarga', medioDePago: m.medioDePago, referencia: m.referencia }
  }
  if (m instanceof Viaje) {
    return {
      ...base,
      tipo: 'viaje',
      servicio: m.servicio,
      tipoServicio: m.tipoServicio,
      punto: m.punto,
      numeroTransbordo: m.numeroTransbordo,
    }
  }
  throw new Error(`Tipo de movimiento desconocido: ${m.tipo}`)
}

function movimientoDesdeDTO(dto: MovimientoDTO): Movimiento {
  const base = { id: dto.id, fecha: new Date(dto.fecha), monto: dto.monto, saldoResultante: dto.saldoResultante }
  if (dto.tipo === 'recarga') {
    return new Recarga({ ...base, medioDePago: dto.medioDePago ?? '', referencia: dto.referencia ?? '' })
  }
  return new Viaje({
    ...base,
    servicio: dto.servicio ?? '',
    tipoServicio: dto.tipoServicio ?? 'troncal',
    punto: dto.punto ?? '',
    numeroTransbordo: dto.numeroTransbordo ?? 0,
  })
}

export function titularADTO(titular: Titular): TitularDTO {
  return {
    id: titular.id,
    nombres: titular.nombres,
    apellidos: titular.apellidos,
    documento: titular.documento,
    tarjetas: titular.tarjetas.map((t) => ({
      numero: t.numero,
      estado: t.estado,
      saldo: t.saldo,
      movimientos: t.historial.movimientos.map(movimientoADTO),
    })),
  }
}

export function titularDesdeDTO(dto: TitularDTO): Titular {
  const titular = new Titular(dto)
  for (const t of dto.tarjetas) {
    titular.agregarTarjeta(
      TarjetaMiLlave.restaurar(t.numero, titular, {
        estado: t.estado,
        saldo: t.saldo,
        movimientos: t.movimientos.map(movimientoDesdeDTO),
      }),
    )
  }
  return titular
}
