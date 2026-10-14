import { LockIcon, LockOpenIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMiLlave } from '@/context/mi-llave-context'
import { formatearPesos } from '@/domain/validaciones'
import { agruparNumeroDeTarjeta } from '@/lib/formato'
import { cn } from '@/lib/utils'

/** Trazo de una línea de transporte con tres paradas: el motivo gráfico de la tarjeta. */
function LineaDeRuta({ apagada }: { apagada: boolean }) {
  return (
    <svg
      viewBox="0 0 320 40"
      aria-hidden="true"
      preserveAspectRatio="none"
      className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full', apagada ? 'text-white/35' : 'text-noche')}
    >
      <path
        d="M-10 30 L70 30 L110 10 L210 10 L250 26 L330 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g stroke="currentColor" strokeWidth="3" className={apagada ? 'fill-noche' : 'fill-tarjeta'}>
        <circle cx="70" cy="30" r="4.5" />
        <circle cx="110" cy="10" r="4.5" />
        <circle cx="250" cy="26" r="4.5" />
      </g>
    </svg>
  )
}

interface Props {
  numero: string
  /** Acción que acompaña al botón de bloqueo (en móvil, "Cambiar tarjeta"). */
  accionExtra?: ReactNode
}

export function TarjetaVisual({ numero, accionExtra }: Props) {
  const app = useMiLlave()
  const tarjeta = app.obtenerTarjeta(numero)
  const bloqueada = !tarjeta.estaActiva

  function alternarBloqueo() {
    if (bloqueada) {
      app.activar(numero)
      toast.success('Tarjeta activada')
    } else {
      app.bloquear(numero)
      toast.success('Tarjeta bloqueada')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
      {/* Única animación de entrada: la tarjeta "llega" al lector. */}
      <div
        className={cn(
          'relative aspect-[1.586] w-full overflow-hidden rounded-2xl p-5 pb-9 transition-colors duration-300',
          'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 motion-reduce:animate-none',
          bloqueada
            ? 'bg-white/10 text-white ring-1 ring-white/30'
            : 'bg-tarjeta text-tarjeta-foreground shadow-[0_18px_40px_-12px] shadow-noche-profunda',
        )}
      >
        <LineaDeRuta apagada={bloqueada} />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-heading text-xl font-semibold tracking-tight">Tu Llave</span>
            {bloqueada ? (
              <Badge className="bg-white text-tinta">
                <LockIcon data-icon="inline-start" />
                Bloqueada
              </Badge>
            ) : (
              <Badge className="bg-noche text-white">Activa</Badge>
            )}
          </div>

          <div>
            <p className="text-sm font-medium">Saldo disponible</p>
            <p
              key={tarjeta.saldo}
              className="font-heading text-5xl leading-none font-bold tracking-tight tabular-nums animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
            >
              {formatearPesos(tarjeta.saldo)}
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-0.5">
            <p className="text-sm font-semibold tracking-widest tabular-nums">{agruparNumeroDeTarjeta(tarjeta.numero)}</p>
            <p className="truncate text-sm">{tarjeta.titular.nombreCompleto}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 *:flex-1">
        <Button variant="outline" className="rounded-xl" onClick={alternarBloqueo}>
          {bloqueada ? <LockOpenIcon data-icon="inline-start" /> : <LockIcon data-icon="inline-start" />}
          {bloqueada ? 'Activar tarjeta' : 'Bloquear tarjeta'}
        </Button>
        {accionExtra}
      </div>
    </div>
  )
}
