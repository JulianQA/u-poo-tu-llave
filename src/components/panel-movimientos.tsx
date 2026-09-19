import { ReceiptTextIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useMiLlave } from '@/context/mi-llave-context'
import type { FiltroDeMovimientos } from '@/domain/movimientos/HistorialDeMovimientos'
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
    <div className="flex flex-col gap-4">
      <FieldGroup className="sm:flex-row sm:items-end">
        <Field className="sm:w-auto">
          <FieldLabel>Mostrar</FieldLabel>
          <ToggleGroup
            className="flex-wrap"
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
        <Empty className="border">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatearFecha(m.fecha)}</TableCell>
                <TableCell>
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge variant={m.tipo === 'recarga' ? 'secondary' : 'outline'}>
                      {m.tipo === 'recarga' ? 'Recarga' : 'Viaje'}
                    </Badge>
                    {m.descripcion}
                  </span>
                </TableCell>
                <TableCell className={cn('text-right font-medium tabular-nums', m.efectoEnSaldo > 0 && 'text-success')}>
                  {m.efectoEnSaldo > 0 ? '+' : '−'}
                  {formatearPesos(m.monto)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatearPesos(m.saldoResultante)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
