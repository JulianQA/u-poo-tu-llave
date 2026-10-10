# UML — Tu Llave

Diagramas del modelo de dominio y de las capas que lo rodean. Están escritos en [Mermaid](https://mermaid.js.org/), así que GitHub y VS Code (con la vista previa de Markdown) los dibujan directamente. Para pasarlos como imagen al documento IEEE se pueden exportar desde [mermaid.live](https://mermaid.live).

**Notación**

| Símbolo        | Significado                                                          |
| -------------- | -------------------------------------------------------------------- |
| `+`            | público                                                              |
| `-`            | privado (en el código son campos `#privados` de JavaScript)          |
| `#`            | protegido                                                            |
| `*` al final   | método abstracto                                                     |
| `$` al final   | método estático                                                      |
| `<<abstract>>` | clase abstracta; `<<interface>>` es una interfaz (puerto)            |
| `<\|--`        | herencia; `<\|..` implementación de interfaz                         |
| `*--`          | composición (la parte no existe sin el todo)                         |
| `o--`          | agregación (la parte se comparte o se inyecta)                       |
| `-->`          | asociación (la clase guarda una referencia)                          |
| `..>`          | dependencia (la usa o la crea, pero no la guarda)                    |

Los getters de TypeScript aparecen como métodos sin parámetros (`saldo() number`).

## 1. Diagrama de clases del dominio

```mermaid
classDiagram
  direction TB

  %% ---------- Núcleo ----------
  class Titular {
    +id: string
    +nombres: string
    +apellidos: string
    +documento: string
    -tarjetas: TarjetaMiLlave[]
    +Titular(datos: DatosTitular)
    +nombreCompleto() string
    +tarjetas() TarjetaMiLlave[]
    +emitirTarjeta(numero: string, saldoInicial: number) TarjetaMiLlave
    +agregarTarjeta(tarjeta: TarjetaMiLlave) void
  }

  class TarjetaMiLlave {
    +numero: string
    +titular: Titular
    -estado: EstadoTarjeta
    -saldo: number
    -movimientos: Movimiento[]
    +TarjetaMiLlave(numero: string, titular: Titular, saldoInicial: number)
    +restaurar(numero: string, titular: Titular, guardado: EstadoGuardado)$ TarjetaMiLlave
    +estado() EstadoTarjeta
    +estaActiva() boolean
    +saldo() number
    +historial() HistorialDeMovimientos
    +ultimoViaje() Viaje
    +bloquear() void
    +activar() void
    +asegurarActiva() void
    +registrarRecarga(monto: number, medioDePago: string, referencia: string, fecha: Date) Recarga
    +registrarViaje(datos: DatosViajeNuevo) Viaje
  }

  class Lector {
    +servicio: ServicioDeTransporte
    +punto: PuntoDeAcceso
    -reloj: Reloj
    +Lector(servicio: ServicioDeTransporte, punto: PuntoDeAcceso, reloj: Reloj)
    +leer(tarjeta: TarjetaMiLlave) LecturaDeTarjeta
    +validar(tarjeta: TarjetaMiLlave) Viaje
  }

  class ProcesadorDeRecargas {
    +configuracion: ConfiguracionDeRecargas
    -reloj: Reloj
    +ProcesadorDeRecargas(configuracion: ConfiguracionDeRecargas, reloj: Reloj)
    +recargar(tarjeta: TarjetaMiLlave, monto: number, medio: MedioDePago) ComprobanteDeRecarga
  }

  class Reloj {
    <<interface>>
    +ahora() Date
  }

  class RelojDelSistema {
    +ahora() Date
  }

  class RepositorioDeTitulares {
    <<interface>>
    +guardar(titular: Titular) void
    +listar() Titular[]
    +buscarTarjeta(numero: string) TarjetaMiLlave
  }

  %% ---------- Movimientos ----------
  class Movimiento {
    <<abstract>>
    +id: string
    +fecha: Date
    +monto: number
    +saldoResultante: number
    +Movimiento(datos: DatosMovimiento)
    +tipo()* TipoMovimiento
    +descripcion()* string
    +efectoEnSaldo()* number
  }

  class Recarga {
    +medioDePago: string
    +referencia: string
    +tipo() TipoMovimiento
    +descripcion() string
    +efectoEnSaldo() number
  }

  class Viaje {
    +servicio: string
    +tipoServicio: TipoServicio
    +punto: string
    +numeroTransbordo: number
    +tipo() TipoMovimiento
    +esTransbordo() boolean
    +descripcion() string
    +efectoEnSaldo() number
  }

  class HistorialDeMovimientos {
    -movimientos: Movimiento[]
    +movimientos() Movimiento[]
    +ordenadoPorFecha(sentido: string) HistorialDeMovimientos
    +filtrar(filtro: FiltroDeMovimientos) HistorialDeMovimientos
    +ultimos(cantidad: number) HistorialDeMovimientos
    +totalRecargado() number
    +totalGastado() number
    -sumar(tipo: TipoMovimiento) number
  }

  %% ---------- Pagos ----------
  class MedioDePago {
    <<abstract>>
    +tipo()* TipoMedioDePago
    +nombre()* string
    #verificar(monto: number, fecha: Date)* void
    +autorizar(monto: number, fecha: Date) AutorizacionDePago
  }

  class PuntoDeRecarga {
    +punto: string
    +tipo() TipoMedioDePago
    +nombre() string
    #verificar(monto: number) void
  }

  class PSE {
    +banco: string
    +correo: string
    +tipo() TipoMedioDePago
    +nombre() string
    #verificar() void
  }

  class TarjetaBancaria {
    -datos: DatosTarjetaBancaria
    +tipo() TipoMedioDePago
    +nombre() string
    #verificar(monto: number, fecha: Date) void
  }

  %% ---------- Transporte ----------
  class ServicioDeTransporte {
    <<abstract>>
    +nombre: string
    #tarifas: TablaDeTarifas
    +ServicioDeTransporte(nombre: string, tarifas: TablaDeTarifas)
    +tipo()* TipoServicio
    +admite(punto: PuntoDeAcceso)* boolean
    +tarifaBase() number
    #admiteTransbordoDesde(anterior: Viaje) boolean
    +calcularTarifa(contexto: ContextoDeViaje) CalculoDeTarifa
  }

  class TransMilenio {
    +tipo() TipoServicio
    +admite(punto: PuntoDeAcceso) boolean
    #admiteTransbordoDesde(anterior: Viaje) boolean
  }

  class SitpZonal {
    +tipo() TipoServicio
    +admite(punto: PuntoDeAcceso) boolean
  }

  class ServicioDual {
    +tipo() TipoServicio
    +admite(punto: PuntoDeAcceso) boolean
    #admiteTransbordoDesde(anterior: Viaje) boolean
  }

  class PuntoDeAcceso {
    <<abstract>>
    +id: string
    +nombre: string
    +PuntoDeAcceso(id: string, nombre: string)
    +tipo()* TipoPunto
  }

  class Estacion {
    +tipo() TipoPunto
  }

  class Paradero {
    +tipo() TipoPunto
  }

  class Tarifa {
    +valor: number
    +Tarifa(valor: number)
  }

  class ReglaDeTransbordo {
    +tarifa: Tarifa
    +ventanaMinutos: number
    +maximoTransbordos: number
    +ReglaDeTransbordo(config: ConfiguracionDeTransbordo)
    +numeroDeTransbordo(ultimoViaje: Viaje, nombreDelPunto: string, ahora: Date) number
  }

  class TablaDeTarifas {
    -porServicio: Map~TipoServicio, Tarifa~
    +transbordo: ReglaDeTransbordo
    +TablaDeTarifas(valores: Record~TipoServicio, number~, transbordo: ConfiguracionDeTransbordo)
    +tarifaDe(tipo: TipoServicio) Tarifa
    +establecer(tipo: TipoServicio, valor: number) void
  }

  %% ---------- Relaciones ----------
  Titular "1" *-- "0..*" TarjetaMiLlave : tarjetas
  TarjetaMiLlave "1" *-- "0..*" Movimiento : movimientos
  TarjetaMiLlave ..> HistorialDeMovimientos : crea
  HistorialDeMovimientos o-- "0..*" Movimiento

  Movimiento <|-- Recarga
  Movimiento <|-- Viaje

  MedioDePago <|-- PuntoDeRecarga
  MedioDePago <|-- PSE
  MedioDePago <|-- TarjetaBancaria

  ServicioDeTransporte <|-- TransMilenio
  ServicioDeTransporte <|-- SitpZonal
  ServicioDeTransporte <|-- ServicioDual
  ServicioDeTransporte "0..*" o-- "1" TablaDeTarifas : tarifas compartidas
  ServicioDeTransporte ..> PuntoDeAcceso : admite
  ServicioDeTransporte ..> Viaje : último viaje

  PuntoDeAcceso <|-- Estacion
  PuntoDeAcceso <|-- Paradero

  TablaDeTarifas "1" *-- "1..*" Tarifa : por servicio
  TablaDeTarifas "1" *-- "1" ReglaDeTransbordo : transbordo
  ReglaDeTransbordo "1" *-- "1" Tarifa : tarifa reducida

  Lector "0..*" --> "1" ServicioDeTransporte
  Lector "0..*" --> "1" PuntoDeAcceso
  Lector --> Reloj
  Lector ..> TarjetaMiLlave : valida y descuenta

  ProcesadorDeRecargas --> Reloj
  ProcesadorDeRecargas ..> MedioDePago : autorizar
  ProcesadorDeRecargas ..> TarjetaMiLlave : abona

  Reloj <|.. RelojDelSistema
  RepositorioDeTitulares ..> Titular
```

## 2. Jerarquía de excepciones

Todas las reglas de negocio violadas se lanzan como una subclase de `ErrorDeDominio`. La interfaz distingue con `instanceof` entre un error de dominio (muestra el mensaje) y uno inesperado.

```mermaid
classDiagram
  direction TB

  class Error {
    +message: string
  }
  class ErrorDeDominio
  class DatosInvalidosError
  class MontoInvalidoError
  class SaldoInsuficienteError {
    +saldo: number
    +requerido: number
    +SaldoInsuficienteError(saldo: number, requerido: number)
  }
  class TarjetaBloqueadaError {
    +TarjetaBloqueadaError(numero: string)
  }
  class TarjetaNoEncontradaError {
    +TarjetaNoEncontradaError(numero: string)
  }
  class PagoRechazadoError
  class PuntoNoAdmitidoError

  Error <|-- ErrorDeDominio
  ErrorDeDominio <|-- DatosInvalidosError
  ErrorDeDominio <|-- MontoInvalidoError
  ErrorDeDominio <|-- SaldoInsuficienteError
  ErrorDeDominio <|-- TarjetaBloqueadaError
  ErrorDeDominio <|-- TarjetaNoEncontradaError
  ErrorDeDominio <|-- PagoRechazadoError
  ErrorDeDominio <|-- PuntoNoAdmitidoError
```

| Excepción                  | Quién la lanza                                                        |
| -------------------------- | --------------------------------------------------------------------- |
| `DatosInvalidosError`      | `Titular`, `TarjetaMiLlave` (número), `Tarifa`, `TablaDeTarifas`, `MiLlaveApp` |
| `MontoInvalidoError`       | `TarjetaMiLlave`, `ProcesadorDeRecargas` (mínimo, máximo, saldo máximo) |
| `SaldoInsuficienteError`   | `TarjetaMiLlave.registrarViaje`                                       |
| `TarjetaBloqueadaError`    | `TarjetaMiLlave.asegurarActiva`                                       |
| `TarjetaNoEncontradaError` | `MiLlaveApp.obtenerTarjeta`                                           |
| `PagoRechazadoError`       | `PuntoDeRecarga`, `PSE`, `TarjetaBancaria` (en `verificar`)           |
| `PuntoNoAdmitidoError`     | constructor de `Lector`                                               |

## 3. Fachada e infraestructura

`MiLlaveApp` es lo único que la interfaz conoce. El dominio define el puerto `RepositorioDeTitulares` y la infraestructura lo implementa, así que el dominio no depende de cómo se guardan los datos.

```mermaid
classDiagram
  direction LR

  class MiLlaveApp {
    -deps: DependenciasDeMiLlaveApp
    -oyentes: Set~Oyente~
    -version: number
    +MiLlaveApp(deps: DependenciasDeMiLlaveApp)
    +suscribir(oyente: Oyente) Function
    +obtenerVersion() number
    +servicios() ServicioDeTransporte[]
    +puntosDe(tipo: TipoServicio) PuntoDeAcceso[]
    +limitesDeRecarga() ConfiguracionDeRecargas
    +listarTarjetas() TarjetaMiLlave[]
    +obtenerTarjeta(numero: string) TarjetaMiLlave
    +leer(numero: string) LecturaDeTarjeta
    +recargar(numero: string, monto: number, medio: MedioDePago) ComprobanteDeRecarga
    +viajar(numero: string, tipo: TipoServicio, idPunto: string) Viaje
    +bloquear(numero: string) void
    +activar(numero: string) void
    -servicio(tipo: TipoServicio) ServicioDeTransporte
    -persistir(tarjeta: TarjetaMiLlave) void
  }

  class RepositorioDeTitulares {
    <<interface>>
    +guardar(titular: Titular) void
    +listar() Titular[]
    +buscarTarjeta(numero: string) TarjetaMiLlave
  }

  class RepositorioEnMemoria {
    #titulares: Map~string, Titular~
    +guardar(titular: Titular) void
    +listar() Titular[]
    +buscarTarjeta(numero: string) TarjetaMiLlave
  }

  class RepositorioLocalStorage {
    -almacenamiento: Almacenamiento
    -clave: string
    +RepositorioLocalStorage(almacenamiento: Almacenamiento, clave: string)
    +guardar(titular: Titular) void
    -cargar() void
  }

  class Almacenamiento {
    <<interface>>
    +getItem(clave: string) string
    +setItem(clave: string, valor: string) void
  }

  class ProcesadorDeRecargas
  class ServicioDeTransporte {
    <<abstract>>
  }
  class PuntoDeAcceso {
    <<abstract>>
  }
  class Reloj {
    <<interface>>
  }
  class Lector

  MiLlaveApp --> "1" RepositorioDeTitulares
  MiLlaveApp --> "1..*" ServicioDeTransporte
  MiLlaveApp --> "1..*" PuntoDeAcceso
  MiLlaveApp --> "1" ProcesadorDeRecargas
  MiLlaveApp --> "1" Reloj
  MiLlaveApp ..> Lector : crea en viajar()

  RepositorioDeTitulares <|.. RepositorioEnMemoria
  RepositorioEnMemoria <|-- RepositorioLocalStorage
  RepositorioLocalStorage --> Almacenamiento
```

## 4. Capas y dependencias

Las flechas indican "depende de". `domain` no depende de ninguna otra capa.

```mermaid
flowchart TB
  components["components/<br/>pantallas React + shadcn"]
  context["context/<br/>useMiLlave"]
  app["app/<br/>MiLlaveApp, composicion"]
  config["config/<br/>tarifas, límites, catálogo"]
  infrastructure["infrastructure/<br/>repositorios, serialización"]
  domain["domain/<br/>TypeScript plano"]

  components --> context
  context --> app
  app --> domain
  app --> config
  app --> infrastructure
  infrastructure --> domain
```

## 5. Secuencias principales

### Validar un viaje

```mermaid
sequenceDiagram
  actor Usuario
  participant App as MiLlaveApp
  participant L as Lector
  participant S as ServicioDeTransporte
  participant R as ReglaDeTransbordo
  participant T as TarjetaMiLlave
  participant Repo as RepositorioDeTitulares

  Usuario->>App: viajar(numero, tipo, idPunto)
  App->>Repo: buscarTarjeta(numero)
  Repo-->>App: tarjeta
  App->>L: new Lector(servicio, punto, reloj)
  App->>L: validar(tarjeta)
  L->>T: asegurarActiva()
  L->>S: calcularTarifa(punto, fecha, ultimoViaje)
  S->>R: numeroDeTransbordo(ultimoViaje, punto, fecha)
  R-->>S: número de transbordo
  S-->>L: valor, numeroTransbordo
  L->>T: registrarViaje(datos)
  T-->>L: Viaje
  L-->>App: Viaje
  App->>Repo: guardar(titular)
  App-->>Usuario: Viaje
```

### Recargar

```mermaid
sequenceDiagram
  actor Usuario
  participant App as MiLlaveApp
  participant P as ProcesadorDeRecargas
  participant M as MedioDePago
  participant T as TarjetaMiLlave
  participant Repo as RepositorioDeTitulares

  Usuario->>App: recargar(numero, monto, medio)
  App->>Repo: buscarTarjeta(numero)
  Repo-->>App: tarjeta
  App->>P: recargar(tarjeta, monto, medio)
  P->>T: asegurarActiva()
  P->>P: validar mínimo, máximo y saldo máximo
  P->>M: autorizar(monto, fecha)
  M->>M: verificar(monto, fecha)
  alt el medio rechaza
    M-->>P: PagoRechazadoError
    P-->>App: PagoRechazadoError (la tarjeta queda intacta)
  else aprobado
    M-->>P: AutorizacionDePago
    P->>T: registrarRecarga(monto, medio, referencia, fecha)
    P-->>App: ComprobanteDeRecarga
    App->>Repo: guardar(titular)
    App-->>Usuario: ComprobanteDeRecarga
  end
```
