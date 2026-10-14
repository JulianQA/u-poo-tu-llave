import { PlusIcon, ReceiptTextIcon } from 'lucide-react'
import { useState } from 'react'
import { MarcaDeServicio } from '@/components/marca-de-servicio'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useMiLlave } from '@/context/mi-llave-context'
import type { FiltroDeMovimientos } from '@/domain/movimientos/HistorialDeMovimientos'
import type { Movimiento } from '@/domain/movimientos/Movimiento'
import { Viaje } from '@/domain/movimientos/Viaje'
import { formatearPesos } from '@/domain/validaciones'
import { formatearFecha } from '@/lib/formato'
import { cn } from '@/lib/utils'

type FiltroDeTipo = 'todos' | 'recarga' | 'viaje'

/** `<input type="date">` entrega "2026-03-10": se interpreta en hora local, no UTC. */
function inicioDelDia(valor: string): Date | undefined {
  return valor === '' ? undefined : new Date(`${valor}T00:00:00`)
}

function finDelDia(valor: string): Date | undefined {
  return valor === '' ? undefined : new Date(`${valor}T23:59:59.999`)
}

function FilaDeMovimiento({ movimiento: m }: { movimiento: Movimiento }) {
  const esRecarga = m.efectoEnSaldo > 0
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          esRecarga ? 'bg-success/12 text-success' : 'bg-secondary',
        )}
      >
        {m instanceof Viaje ? <MarcaDeServicio tipo={m.tipoServicio} className="size-3" /> : <PlusIcon className="size-4" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-medium">
          <span className="sr-only">{esRecarga ? 'Recarga: ' : 'Viaje: '}</span>
          {m.descripcion}
        </p>
        <p className="text-xs text-muted-foreground">{formatearFecha(m.fecha)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
        <p className={cn('font-semibold', esRecarga && 'text-success')}>
          {esRecarga ? '+' : '−'}
          {formatearPesos(m.monto)}
        </p>
        <p className="text-xs text-muted-foreground">Saldo {formatearPesos(m.saldoResultante)}</p>
      </div>
    </li>
  )
}

export function PanelMovimientos({ numero }: { numero: string }) {
  const app = useMiLlave()
  const [tipo, setTipo] = useState<FiltroDeTipo>('todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const filtro: FiltroDeMovimientos = {
    tipo: tipo === 'todos' ? undefined : tipo,
    desde: inicioDelDia(desde),
    hasta: finDelDia(hasta),
  }
  const historial = app.obtenerTarjeta(numero).historial
  const movimientos = historial.filtrar(filtro).ordenadoPorFecha().movimientos

  return (
    <div className="flex flex-col gap-5">
      <FieldGroup className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-end">
        <Field className="col-span-2 sm:w-auto">
          <FieldLabel>Mostrar</FieldLabel>
          <ToggleGroup
            className="grid w-full grid-cols-3 sm:flex sm:w-fit"
            type="single"
            variant="outline"
            value={tipo}
            onValueChange={(valor) => valor !== '' && setTipo(valor as FiltroDeTipo)}
          >
            <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
            <ToggleGroupItem value="recarga">Recargas</ToggleGroupItem>
            <ToggleGroupItem value="viaje">Viajes</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="filtro-desde">Desde</FieldLabel>
          <Input id="filtro-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="filtro-hasta">Hasta</FieldLabel>
          <Input id="filtro-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
        </Field>
      </FieldGroup>

      {movimientos.length === 0 ? (
        <Empty className="rounded-2xl bg-muted">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            <EmptyTitle>Sin movimientos</EmptyTitle>
            <EmptyDescription>
              {historial.movimientos.length === 0
                ? 'Esta tarjeta todavía no tiene recargas ni viajes.'
                : 'Ningún movimiento coincide con los filtros. Prueba con otro rango de fechas.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul aria-label="Movimientos" className="flex flex-col divide-y">
          {movimientos.map((m) => (
            <FilaDeMovimiento key={m.id} movimiento={m} />
          ))}
        </ul>
      )}
    </div>
  )
}
