import { NfcIcon } from 'lucide-react'
import { useState, type SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { useMiLlave } from '@/context/mi-llave-context'
import { agruparNumeroDeTarjeta } from '@/lib/formato'
import { mensajeDeError } from '@/lib/mensaje-de-error'

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
            <InputGroup>
              <InputGroupInput
                id="numero-tarjeta"
                inputMode="numeric"
                autoComplete="off"
                placeholder="16 dígitos"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-invalid={error !== null}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="submit" variant="default">
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

      <div className="flex flex-col gap-2">
        {app.listarTarjetas().map((tarjeta) => (
          <Button
            key={tarjeta.numero}
            variant={tarjeta.numero === numeroActual ? 'secondary' : 'outline'}
            className="h-auto justify-between py-2"
            onClick={() => leer(tarjeta.numero)}
          >
            <span className="flex flex-col items-start">
              <span className="font-medium">{tarjeta.titular.nombreCompleto}</span>
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {agruparNumeroDeTarjeta(tarjeta.numero)}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">{tarjeta.estaActiva ? 'Activa' : 'Bloqueada'}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
