import { CircleXIcon, WalletIcon } from 'lucide-react'
import { useState, type SyntheticEvent } from 'react'
import { ComprobanteDialog } from '@/components/comprobante-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BANCOS_PSE, PUNTOS_DE_RECARGA } from '@/config/miLlave.config'
import { useMiLlave } from '@/context/mi-llave-context'
import type { MedioDePago, TipoMedioDePago } from '@/domain/pagos/MedioDePago'
import { PSE } from '@/domain/pagos/PSE'
import { PuntoDeRecarga } from '@/domain/pagos/PuntoDeRecarga'
import { TarjetaBancaria, type TipoTarjetaBancaria } from '@/domain/pagos/TarjetaBancaria'
import type { ComprobanteDeRecarga } from '@/domain/ProcesadorDeRecargas'
import { formatearPesos } from '@/domain/validaciones'
import { leerMonto } from '@/lib/formato'
import { mensajeDeError } from '@/lib/mensaje-de-error'

const MONTOS_RAPIDOS = [5000, 10_000, 20_000, 50_000] as const

interface Formulario {
  monto: string
  medio: TipoMedioDePago
  puntoDeRecarga: string
  banco: string
  correo: string
  tipoTarjeta: TipoTarjetaBancaria
  numeroTarjeta: string
  vencimiento: string
  cvv: string
}

const FORMULARIO_INICIAL: Formulario = {
  monto: '',
  medio: 'efectivo',
  puntoDeRecarga: PUNTOS_DE_RECARGA[0],
  banco: BANCOS_PSE[0],
  correo: '',
  tipoTarjeta: 'debito',
  numeroTarjeta: '',
  vencimiento: '',
  cvv: '',
}

/** Traduce lo que hay en el formulario a la clase de dominio que corresponda: la UI solo elige, el dominio decide. */
function crearMedioDePago(f: Formulario): MedioDePago {
  switch (f.medio) {
    case 'efectivo':
      return new PuntoDeRecarga(f.puntoDeRecarga)
    case 'pse':
      return new PSE(f.banco, f.correo)
    case 'tarjeta': {
      const partes = /^(\d{1,2})\s*\/\s*(\d{2})$/.exec(f.vencimiento.trim())
      return new TarjetaBancaria({
        tipoTarjeta: f.tipoTarjeta,
        numero: f.numeroTarjeta,
        mes: partes ? Number(partes[1]) : 0,
        anio: partes ? 2000 + Number(partes[2]) : 0,
        cvv: f.cvv,
      })
    }
  }
}

export function PanelRecarga({ numero }: { numero: string }) {
  const app = useMiLlave()
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [error, setError] = useState<string | null>(null)
  const [comprobante, setComprobante] = useState<ComprobanteDeRecarga | null>(null)

  const { minimo, maximo } = app.limitesDeRecarga
  const monto = leerMonto(formulario.monto)
  const montoRapido = MONTOS_RAPIDOS.find((m) => m === monto)

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    setError(null)
  }

  function recargar(evento: SyntheticEvent) {
    evento.preventDefault()
    try {
      const resultado = app.recargar(numero, monto, crearMedioDePago(formulario))
      setComprobante(resultado)
      setFormulario((actual) => ({ ...actual, monto: '', cvv: '' }))
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  return (
    // noValidate: las reglas las aplica el dominio y su mensaje se muestra en la alerta, no el globo nativo del navegador.
    <form onSubmit={recargar} noValidate className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="monto-recarga">Valor de la recarga</FieldLabel>
          <ToggleGroup
            className="flex-wrap"
            type="single"
            variant="outline"
            value={montoRapido === undefined ? '' : String(montoRapido)}
            onValueChange={(valor) => valor !== '' && actualizar('monto', valor)}
          >
            {MONTOS_RAPIDOS.map((m) => (
              <ToggleGroupItem key={m} value={String(m)}>
                {formatearPesos(m)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <InputGroup className="sm:w-56">
            <InputGroupAddon>
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="monto-recarga"
              inputMode="numeric"
              placeholder="Otro valor"
              value={formulario.monto}
              onChange={(e) => actualizar('monto', e.target.value)}
            />
          </InputGroup>
          <FieldDescription>
            Entre {formatearPesos(minimo)} y {formatearPesos(maximo)}.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Medio de pago</FieldLabel>
          <ToggleGroup
            className="flex-wrap"
            type="single"
            variant="outline"
            value={formulario.medio}
            onValueChange={(valor) => valor !== '' && actualizar('medio', valor as TipoMedioDePago)}
          >
            <ToggleGroupItem value="efectivo">Efectivo</ToggleGroupItem>
            <ToggleGroupItem value="pse">PSE</ToggleGroupItem>
            <ToggleGroupItem value="tarjeta">Tarjeta débito o crédito</ToggleGroupItem>
          </ToggleGroup>
        </Field>

        {formulario.medio === 'efectivo' ? (
          <Field>
            <FieldLabel htmlFor="punto-de-recarga">Punto de recarga</FieldLabel>
            <Select value={formulario.puntoDeRecarga} onValueChange={(v) => actualizar('puntoDeRecarga', v)}>
              <SelectTrigger id="punto-de-recarga" className="w-full sm:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PUNTOS_DE_RECARGA.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>En efectivo el valor debe ser múltiplo de $1.000.</FieldDescription>
          </Field>
        ) : null}

        {formulario.medio === 'pse' ? (
          <>
            <Field>
              <FieldLabel htmlFor="banco-pse">Banco</FieldLabel>
              <Select value={formulario.banco} onValueChange={(v) => actualizar('banco', v)}>
                <SelectTrigger id="banco-pse" className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {BANCOS_PSE.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="correo-pse">Correo electrónico</FieldLabel>
              <Input
                id="correo-pse"
                type="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
                className="sm:w-80"
                value={formulario.correo}
                onChange={(e) => actualizar('correo', e.target.value)}
              />
            </Field>
          </>
        ) : null}

        {formulario.medio === 'tarjeta' ? (
          <>
            <Field>
              <FieldLabel>Tipo de tarjeta</FieldLabel>
              <ToggleGroup
            className="flex-wrap"
                type="single"
                variant="outline"
                value={formulario.tipoTarjeta}
                onValueChange={(valor) => valor !== '' && actualizar('tipoTarjeta', valor as TipoTarjetaBancaria)}
              >
                <ToggleGroupItem value="debito">Débito</ToggleGroupItem>
                <ToggleGroupItem value="credito">Crédito</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="numero-bancario">Número de la tarjeta</FieldLabel>
              <Input
                id="numero-bancario"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4111 1111 1111 1111"
                className="sm:w-80"
                value={formulario.numeroTarjeta}
                onChange={(e) => actualizar('numeroTarjeta', e.target.value)}
              />
            </Field>
            <div className="flex gap-4">
              <Field>
                <FieldLabel htmlFor="vencimiento">Vence (MM/AA)</FieldLabel>
                <Input
                  id="vencimiento"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="12/30"
                  value={formulario.vencimiento}
                  onChange={(e) => actualizar('vencimiento', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="cvv">CVV</FieldLabel>
                <Input
                  id="cvv"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength={4}
                  value={formulario.cvv}
                  onChange={(e) => actualizar('cvv', e.target.value)}
                />
              </Field>
            </div>
            <FieldDescription>Es una simulación: prueba con 4111 1111 1111 1111. No se guarda ningún dato.</FieldDescription>
          </>
        ) : null}
      </FieldGroup>

      {error === null ? null : (
        <Alert variant="destructive">
          <CircleXIcon />
          <AlertTitle>No se pudo hacer la recarga</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Button type="submit">
          <WalletIcon data-icon="inline-start" />
          {Number.isFinite(monto) && monto > 0 ? `Recargar ${formatearPesos(monto)}` : 'Recargar'}
        </Button>
      </div>

      <ComprobanteDialog comprobante={comprobante} alCerrar={() => setComprobante(null)} />
    </form>
  )
}
