import { CircleCheckIcon, CircleXIcon, NfcIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { MarcaDeServicio } from '@/components/marca-de-servicio'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useMiLlave } from '@/context/mi-llave-context'
import type { Viaje } from '@/domain/movimientos/Viaje'
import type { TipoServicio } from '@/domain/transporte/ServicioDeTransporte'
import { formatearPesos } from '@/domain/validaciones'
import { mensajeDeError } from '@/lib/mensaje-de-error'

type Resultado = { tipo: 'ok'; viaje: Viaje } | { tipo: 'error'; mensaje: string }

export function PanelViaje({ numero }: { numero: string }) {
  const app = useMiLlave()
  const [servicio, setServicio] = useState<TipoServicio>('troncal')
  const [punto, setPunto] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const servicioElegido = app.servicios.find((s) => s.tipo === servicio)
  const puntos = app.puntosDe(servicio)
  const etiquetaDelPunto = servicio === 'zonal' ? 'Paradero' : servicio === 'troncal' ? 'Estación' : 'Estación o paradero'

  function elegirServicio(nuevo: TipoServicio) {
    setServicio(nuevo)
    setPunto('')
    setResultado(null)
  }

  function pasarPorElLector() {
    try {
      const viaje = app.viajar(numero, servicio, punto)
      setResultado({ tipo: 'ok', viaje })
      toast.success(`Viaje registrado: −${formatearPesos(viaje.monto)}`)
    } catch (e) {
      setResultado({ tipo: 'error', mensaje: mensajeDeError(e) })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel>Servicio</FieldLabel>
          <ToggleGroup
            className="grid w-full grid-cols-1 sm:flex sm:w-fit sm:flex-wrap"
            type="single"
            variant="outline"
            value={servicio}
            onValueChange={(valor) => valor !== '' && elegirServicio(valor as TipoServicio)}
          >
            {app.servicios.map((s) => (
              <ToggleGroupItem key={s.tipo} value={s.tipo} className="justify-start gap-2.5 sm:justify-center">
                <MarcaDeServicio tipo={s.tipo} className="ring-2 ring-white" />
                {s.nombre}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {servicioElegido !== undefined ? (
            <FieldDescription>Pasaje: {formatearPesos(servicioElegido.tarifaBase)}</FieldDescription>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="punto-de-acceso">{etiquetaDelPunto}</FieldLabel>
          <Select value={punto} onValueChange={(valor) => { setPunto(valor); setResultado(null) }}>
            <SelectTrigger id="punto-de-acceso" className="w-full sm:w-80">
              <SelectValue placeholder={`Elige ${etiquetaDelPunto === 'Paradero' ? 'un paradero' : 'una estación'}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {puntos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <div>
        <Button onClick={pasarPorElLector} disabled={punto === ''} size="lg" className="h-12 w-full rounded-xl text-base sm:w-auto sm:px-6">
          <NfcIcon data-icon="inline-start" />
          Pasar por el lector
        </Button>
      </div>

      {resultado === null ? null : resultado.tipo === 'ok' ? (
        <Alert className="border-success/40 bg-success/5">
          <CircleCheckIcon className="text-success" />
          <AlertTitle>{resultado.viaje.esTransbordo ? 'Transbordo registrado' : 'Viaje registrado'}</AlertTitle>
          <AlertDescription>
            {resultado.viaje.descripcion}. Se descontaron {formatearPesos(resultado.viaje.monto)}; el saldo ahora es{' '}
            {formatearPesos(resultado.viaje.saldoResultante)}.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <CircleXIcon />
          <AlertTitle>No se pudo validar la tarjeta</AlertTitle>
          <AlertDescription>{resultado.mensaje}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
