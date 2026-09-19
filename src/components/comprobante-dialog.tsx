import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { ComprobanteDeRecarga } from '@/domain/ProcesadorDeRecargas'
import { formatearPesos } from '@/domain/validaciones'
import { agruparNumeroDeTarjeta, formatearFechaLarga } from '@/lib/formato'

interface Props {
  comprobante: ComprobanteDeRecarga | null
  alCerrar: () => void
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="text-right font-medium tabular-nums">{valor}</dd>
    </div>
  )
}

export function ComprobanteDialog({ comprobante, alCerrar }: Props) {
  return (
    <Dialog open={comprobante !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recarga exitosa</DialogTitle>
          <DialogDescription>Guarda el número de comprobante por si necesitas hacer un reclamo.</DialogDescription>
        </DialogHeader>
        {comprobante === null ? null : (
          <dl className="flex flex-col gap-2 text-sm">
            <Fila etiqueta="Comprobante" valor={comprobante.numero} />
            <Fila etiqueta="Fecha" valor={formatearFechaLarga(comprobante.fecha)} />
            <Fila etiqueta="Titular" valor={comprobante.titular} />
            <Fila etiqueta="Tarjeta" valor={agruparNumeroDeTarjeta(comprobante.numeroTarjeta)} />
            <Fila etiqueta="Medio de pago" valor={comprobante.medioDePago} />
            <Separator />
            <Fila etiqueta="Saldo anterior" valor={formatearPesos(comprobante.saldoAnterior)} />
            <Fila etiqueta="Valor recargado" valor={formatearPesos(comprobante.monto)} />
            <Fila etiqueta="Saldo nuevo" valor={formatearPesos(comprobante.saldoNuevo)} />
          </dl>
        )}
        <DialogFooter>
          <Button onClick={alCerrar}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
