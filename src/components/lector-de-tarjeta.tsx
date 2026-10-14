import { NfcIcon } from 'lucide-react'
import { useState, type SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { useMiLlave } from '@/context/mi-llave-context'
import { agruparNumeroDeTarjeta } from '@/lib/formato'
import { mensajeDeError } from '@/lib/mensaje-de-error'
import { cn } from '@/lib/utils'

interface Props {
  numeroActual: string | null
  alAcercar: (numero: string) => void
}

/** Simula "acercar la tarjeta" al lector: se escribe el número o se elige una tarjeta de demostración. */
export function LectorDeTarjeta({ numeroActual, alAcercar }: Props) {
  const app = useMiLlave()
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)

  function leer(numero: string) {
    try {
      const lectura = app.leer(numero)
      setError(null)
      setTexto('')
      alAcercar(lectura.numero)
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  function alEnviar(evento: SyntheticEvent) {
    evento.preventDefault()
    leer(texto)
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={alEnviar}>
        <FieldGroup>
          <Field data-invalid={error !== null}>
            <FieldLabel htmlFor="numero-tarjeta">Número de tarjeta</FieldLabel>
            <InputGroup className="h-12 rounded-xl bg-white/10">
              <InputGroupInput
                id="numero-tarjeta"
                className="text-base tabular-nums"
                inputMode="numeric"
                autoComplete="off"
                placeholder="16 dígitos"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-invalid={error !== null}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="submit" variant="default" className="h-9 rounded-lg px-3">
                  <NfcIcon data-icon="inline-start" />
                  Acercar
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {error !== null ? (
              <FieldError>{error}</FieldError>
            ) : (
              <FieldDescription>Escribe el número o elige una tarjeta de demostración.</FieldDescription>
            )}
          </Field>
        </FieldGroup>
      </form>

      <section aria-labelledby="titulo-demostracion" className="flex flex-col gap-2">
        <h2 id="titulo-demostracion" className="font-sans text-sm font-medium">
          Tarjetas de demostración
        </h2>
        {app.listarTarjetas().map((tarjeta) => {
          const actual = tarjeta.numero === numeroActual
          return (
            <Button
              key={tarjeta.numero}
              variant={actual ? 'secondary' : 'outline'}
              aria-pressed={actual}
              className={cn('h-auto justify-between gap-3 rounded-xl px-3 py-2.5 text-left', actual && 'ring-2 ring-tarjeta')}
              onClick={() => leer(tarjeta.numero)}
            >
              <span className="flex min-w-0 flex-col items-start">
                <span className="truncate font-medium">{tarjeta.titular.nombreCompleto}</span>
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  {agruparNumeroDeTarjeta(tarjeta.numero)}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className={cn('size-2 rounded-full', tarjeta.estaActiva ? 'bg-tarjeta' : 'bg-white/40')}
                />
                {tarjeta.estaActiva ? 'Activa' : 'Bloqueada'}
              </span>
            </Button>
          )
        })}
      </section>
    </div>
  )
}
