import { LockIcon, LockOpenIcon } from 'lucide-react'
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
      className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full', apagada ? 'text-background/50' : 'text-signal')}
    >
      <path
        d="M-10 30 L70 30 L110 10 L210 10 L250 26 L330 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g stroke="currentColor" strokeWidth="3" className={apagada ? 'fill-muted-foreground' : 'fill-primary'}>
        <circle cx="70" cy="30" r="4.5" />
        <circle cx="110" cy="10" r="4.5" />
        <circle cx="250" cy="26" r="4.5" />
      </g>
    </svg>
  )
}

export function TarjetaVisual({ numero }: { numero: string }) {
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
      <div
        className={cn(
          'relative aspect-[1.586] w-full overflow-hidden rounded-2xl p-5 pb-9 shadow-lg transition-colors duration-300',
          bloqueada
            ? 'bg-muted-foreground text-background shadow-foreground/10'
            : 'bg-primary text-primary-foreground shadow-primary/25',
        )}
      >
        <LineaDeRuta apagada={bloqueada} />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-heading text-xl font-semibold tracking-tight">Tu Llave</span>
            {bloqueada ? (
              <Badge className="bg-background text-destructive">Bloqueada</Badge>
            ) : (
              <Badge className="bg-signal text-signal-foreground">Activa</Badge>
            )}
          </div>

          <div>
            <p className="text-sm opacity-80">Saldo disponible</p>
            <p
              key={tarjeta.saldo}
              className="font-heading text-5xl leading-none font-bold tracking-tight tabular-nums animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
            >
              {formatearPesos(tarjeta.saldo)}
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-0.5">
            <p className="text-sm font-medium tracking-widest tabular-nums">{agruparNumeroDeTarjeta(tarjeta.numero)}</p>
            <p className="truncate text-sm opacity-90">{tarjeta.titular.nombreCompleto}</p>
          </div>
        </div>
      </div>

      <Button variant="outline" onClick={alternarBloqueo}>
        {bloqueada ? <LockOpenIcon data-icon="inline-start" /> : <LockIcon data-icon="inline-start" />}
        {bloqueada ? 'Activar tarjeta' : 'Bloquear tarjeta'}
      </Button>
    </div>
  )
}
