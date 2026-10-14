import { ArrowLeftRightIcon, BusFrontIcon, NfcIcon, ReceiptTextIcon, TriangleAlertIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { LectorDeTarjeta } from '@/components/lector-de-tarjeta'
import { PanelMovimientos } from '@/components/panel-movimientos'
import { PanelRecarga } from '@/components/panel-recarga'
import { PanelViaje } from '@/components/panel-viaje'
import { TarjetaVisual } from '@/components/tarjeta-visual'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { useMiLlave } from '@/context/mi-llave-context'
import { cn } from '@/lib/utils'

/** Lugar de la tarjeta mientras no se ha acercado ninguna: mismo tamaño, para que nada salte al leerla. */
function RanuraVacia() {
  return (
    <div className="mx-auto flex aspect-[1.586] w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/40 p-6 text-center">
      <NfcIcon className="size-8 text-tarjeta" aria-hidden="true" />
      <p className="font-heading text-lg font-semibold text-balance">Acerca una tarjeta al lector</p>
    </div>
  )
}

function SinTarjeta() {
  return (
    <Empty className="rounded-3xl border border-dashed bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <NfcIcon />
        </EmptyMedia>
        <EmptyTitle>Todavía no hay una tarjeta en el lector</EmptyTitle>
        <EmptyDescription>
          Escribe el número de una tarjeta o elige una de demostración para ver su saldo, recargarla o simular un viaje.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

const CLASES_PESTANA =
  'h-full flex-col gap-1 rounded-xl text-xs text-muted-foreground sm:flex-row sm:gap-2 sm:text-sm hover:bg-muted data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:hover:bg-primary data-active:hover:text-primary-foreground'

function App() {
  const app = useMiLlave()
  const [numero, setNumero] = useState<string | null>(null)
  // En móvil el lector se pliega cuando ya hay una tarjeta, para que las operaciones queden a la vista.
  const [cambiandoTarjeta, setCambiandoTarjeta] = useState(false)
  const lectorVisible = numero === null || cambiandoTarjeta

  function acercar(nuevo: string) {
    setNumero(nuevo)
    setCambiandoTarjeta(false)
  }
  const bloqueada = numero !== null && !app.obtenerTarjeta(numero).estaActiva

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[minmax(24rem,28rem)_minmax(0,1fr)]">
      <header className="zona-lector lg:sticky lg:top-0 lg:h-svh lg:overflow-y-auto">
        <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-tarjeta text-tarjeta-foreground" aria-hidden="true">
              <NfcIcon className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl leading-none font-bold tracking-tight">Tu Llave</h1>
              <p className="mt-1 text-sm text-muted-foreground">Simulador de la tarjeta de transporte de Bogotá</p>
            </div>
          </div>

          {numero === null ? (
            <RanuraVacia />
          ) : (
            <TarjetaVisual
              key={numero}
              numero={numero}
              accionExtra={
                <Button
                  variant={cambiandoTarjeta ? 'secondary' : 'outline'}
                  className="rounded-xl lg:hidden"
                  aria-expanded={cambiandoTarjeta}
                  aria-controls="lector"
                  onClick={() => setCambiandoTarjeta((actual) => !actual)}
                >
                  <ArrowLeftRightIcon data-icon="inline-start" />
                  Cambiar tarjeta
                </Button>
              }
            />
          )}
          <div id="lector" className={cn(lectorVisible ? 'block' : 'hidden lg:block')}>
            <LectorDeTarjeta numeroActual={numero} alAcercar={acercar} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {numero === null ? (
          <div className="hidden lg:block">
            <SinTarjeta />
          </div>
        ) : (
          <section aria-label="Operaciones de la tarjeta" className="flex flex-col gap-5">
            {bloqueada ? (
              <Alert variant="destructive" className="rounded-2xl">
                <TriangleAlertIcon />
                <AlertTitle>Tarjeta bloqueada</AlertTitle>
                <AlertDescription>Actívala con el botón bajo la tarjeta para recargar o viajar.</AlertDescription>
              </Alert>
            ) : null}
            <Tabs defaultValue="movimientos" className="gap-4">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl border bg-card p-1.5 group-data-horizontal/tabs:h-16 sm:group-data-horizontal/tabs:h-14">
                <TabsTrigger value="movimientos" className={CLASES_PESTANA}>
                  <ReceiptTextIcon aria-hidden="true" />
                  Movimientos
                </TabsTrigger>
                <TabsTrigger value="recargar" className={CLASES_PESTANA}>
                  <WalletIcon aria-hidden="true" />
                  Recargar
                </TabsTrigger>
                <TabsTrigger value="viajar" className={CLASES_PESTANA}>
                  <BusFrontIcon aria-hidden="true" />
                  Viajar
                </TabsTrigger>
              </TabsList>
              {/* `key={numero}` reinicia filtros y formularios al cambiar de tarjeta. */}
              <TabsContent value="movimientos" className="rounded-3xl border bg-card p-4 sm:p-6">
                <PanelMovimientos key={numero} numero={numero} />
              </TabsContent>
              <TabsContent value="recargar" className="rounded-3xl border bg-card p-4 sm:p-6">
                <PanelRecarga key={numero} numero={numero} />
              </TabsContent>
              <TabsContent value="viajar" className="rounded-3xl border bg-card p-4 sm:p-6">
                <PanelViaje key={numero} numero={numero} />
              </TabsContent>
            </Tabs>
          </section>
        )}

        <footer className="mt-auto text-sm text-muted-foreground">
          Simulador académico de POO. Las tarifas y los límites son valores de referencia configurables.
        </footer>
      </main>
      <Toaster position="top-center" />
    </div>
  )
}

export default App
