import { NfcIcon, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { LectorDeTarjeta } from '@/components/lector-de-tarjeta'
import { PanelMovimientos } from '@/components/panel-movimientos'
import { PanelRecarga } from '@/components/panel-recarga'
import { PanelViaje } from '@/components/panel-viaje'
import { TarjetaVisual } from '@/components/tarjeta-visual'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { useMiLlave } from '@/context/mi-llave-context'

function SinTarjeta() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <NfcIcon />
        </EmptyMedia>
        <EmptyTitle>Acerca una tarjeta al lector</EmptyTitle>
        <EmptyDescription>
          Escribe el número de una tarjeta o elige una de demostración para ver su saldo, recargarla o simular un viaje.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function App() {
  const app = useMiLlave()
  const [numero, setNumero] = useState<string | null>(null)
  const bloqueada = numero !== null && !app.obtenerTarjeta(numero).estaActiva

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Tu Llave</h1>
        <p className="text-muted-foreground">Simulador de la tarjeta de transporte de Bogotá</p>
      </header>

      <main className="grid flex-1 grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
          {numero === null ? null : <TarjetaVisual numero={numero} />}
          <LectorDeTarjeta numeroActual={numero} alAcercar={setNumero} />
        </aside>

        <section aria-label="Operaciones de la tarjeta">
          {numero === null ? (
            <SinTarjeta />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tu tarjeta</CardTitle>
                <CardDescription>Consulta los movimientos, recarga saldo o simula un viaje.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {bloqueada ? (
                  <Alert variant="destructive">
                    <TriangleAlertIcon />
                    <AlertTitle>Tarjeta bloqueada</AlertTitle>
                    <AlertDescription>Actívala desde el botón bajo la tarjeta para recargar o viajar.</AlertDescription>
                  </Alert>
                ) : null}
                <Tabs defaultValue="movimientos">
                  <TabsList>
                    <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
                    <TabsTrigger value="recargar">Recargar</TabsTrigger>
                    <TabsTrigger value="viajar">Viajar</TabsTrigger>
                  </TabsList>
                  {/* `key={numero}` reinicia filtros y formularios al cambiar de tarjeta. */}
                  <TabsContent value="movimientos" className="pt-4">
                    <PanelMovimientos key={numero} numero={numero} />
                  </TabsContent>
                  <TabsContent value="recargar" className="pt-4">
                    <PanelRecarga key={numero} numero={numero} />
                  </TabsContent>
                  <TabsContent value="viajar" className="pt-4">
                    <PanelViaje key={numero} numero={numero} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <footer className="text-sm text-muted-foreground">
        Simulador académico de POO. Las tarifas y los límites son valores de referencia configurables.
      </footer>
      <Toaster position="bottom-right" />
    </div>
  )
}

export default App
