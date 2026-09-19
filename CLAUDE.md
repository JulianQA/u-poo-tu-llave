# Tu Llave — simulador de la tarjeta de transporte de Bogotá

Proyecto de la materia de **Programación Orientada a Objetos** (UNIMINUTO). Lo que más se evalúa es el **modelo de dominio** (clases, herencia, polimorfismo, abstracción, encapsulamiento, excepciones); la interfaz es secundaria. También se entrega un documento en formato IEEE, así que la separación de capas debe poder justificarse y el núcleo debe poder probarse sin interfaz.

Idioma: el código de dominio, los textos de la UI, los comentarios y los commits van **en español**.

> **Mantén este archivo actualizado.** Cada vez que cambies la arquitectura, agregues una clase, una regla de negocio, un comando o una convención, actualiza la sección correspondiente en el mismo cambio.

## Comandos

Gestor de paquetes: **bun**.

| Comando | Qué hace |
| --- | --- |
| `bun dev` | Servidor de desarrollo (Vite) |
| `bun run build` | `tsc -b` + build de producción |
| `bun run test` | Pruebas del dominio y de la fachada (Vitest, entorno Node) |
| `bun run lint` | oxlint |
| `npx shadcn@latest add <componente>` | Agrega componentes shadcn |

`bunx --bun shadcn@latest` falla con bun 1.2.4 (`Script not found`): usar `npx shadcn@latest`.

## Arquitectura (capas)

```
src/
  domain/          TypeScript plano. NO importa React, DOM ni nada de infrastructure/app/config.
    movimientos/   Movimiento (abstracta) → Recarga, Viaje; HistorialDeMovimientos
    pagos/         MedioDePago (abstracta) → PuntoDeRecarga, PSE, TarjetaBancaria
    transporte/    ServicioDeTransporte (abstracta) → TransMilenio, SitpZonal, ServicioDual;
                   PuntoDeAcceso (abstracta) → Estacion, Paradero; Tarifa, TablaDeTarifas, ReglaDeTransbordo
    TarjetaMiLlave, Titular, Lector, ProcesadorDeRecargas, RepositorioDeTitulares (puerto),
    errores.ts, reloj.ts, validaciones.ts, ids.ts
  infrastructure/  Implementaciones del puerto: RepositorioEnMemoria, RepositorioLocalStorage, serializacion (JSON versionado)
  config/          miLlave.config.ts: tarifas, límites de recarga, catálogo de estaciones/paraderos/bancos
  app/             MiLlaveApp (fachada que usa la UI), composicion.ts (compone dependencias), datosDeDemostracion.ts
  context/         mi-llave-context.ts: contexto + hook useMiLlave (useSyncExternalStore sobre la fachada)
  components/      Componentes de pantalla (panel-*, tarjeta-visual, lector-de-tarjeta, comprobante-dialog)
  components/ui/   Componentes shadcn (generados por la CLI; no editar salvo necesidad)
  lib/             formato.ts, mensaje-de-error.ts, utils.ts (cn)
```

Regla de dependencias: `components → context → app → domain`; `infrastructure → domain`; `domain` no depende de nadie. Si un archivo de `domain/` necesita algo de React o del navegador, está mal ubicado.

## Modelo de dominio

- **TarjetaMiLlave**: número (16 dígitos), `titular`, estado `activa | bloqueada`, saldo. Saldo, estado y movimientos son campos `#privados`; solo cambian con `registrarRecarga` / `registrarViaje`, que validan y dejan un `Movimiento`. `restaurar()` reconstruye desde el almacenamiento.
- **Titular**: datos básicos y sus tarjetas (`emitirTarjeta`, `agregarTarjeta`).
- **Movimiento** (abstracta): id, fecha, monto, saldoResultante; abstractos `tipo`, `descripcion`, `efectoEnSaldo`. Inmutable. `Recarga` (medio, referencia) y `Viaje` (servicio, punto, nº de transbordo).
- **MedioDePago** (abstracta, método plantilla `autorizar` → `verificar`): `PuntoDeRecarga` (múltiplos de $1.000), `PSE` (correo válido), `TarjetaBancaria` (Luhn, vencimiento, CVV).
- **ServicioDeTransporte** (abstracta, método plantilla `calcularTarifa`): cada subclase define `admite(punto)`, `tipo` y `admiteTransbordoDesde`. TransMilenio solo atiende estaciones y no da transbordo troncal→troncal; SitpZonal solo paraderos; ServicioDual ambos y no encadena con otro dual.
- **Tarifas configurables**: `TablaDeTarifas` se inyecta (misma instancia) a todos los servicios; `establecer(tipo, valor)` cambia la tarifa en caliente. Nunca poner valores de tarifa dentro de las clases.
- **Transbordo**: `ReglaDeTransbordo` (ventana en minutos, tarifa reducida, máximo de transbordos, punto distinto).
- **Lector**: torniquete/validador de un servicio en un punto (falla si el servicio no atiende ese punto). `validar(tarjeta)` valida, calcula tarifa y descuenta. `leerTarjeta()` es solo consulta.
- **ProcesadorDeRecargas**: valida mínimo/máximo/saldo máximo, cobra con el medio y solo entonces abona; si el medio rechaza, la tarjeta queda intacta.
- **Excepciones** (`errores.ts`, todas extienden `ErrorDeDominio`): `MontoInvalidoError`, `SaldoInsuficienteError`, `TarjetaBloqueadaError`, `TarjetaNoEncontradaError`, `PagoRechazadoError`, `PuntoNoAdmitidoError`, `DatosInvalidosError`. La UI usa `mensajeDeError()`: muestra el mensaje solo si es un `ErrorDeDominio`.
- **Reloj**: el dominio nunca llama a `new Date()` para reglas de negocio; recibe un `Reloj` (las pruebas usan uno fijo).

## Convenciones de código

- `tsconfig` tiene `erasableSyntaxOnly`: **sin `enum` ni propiedades de parámetro** (`constructor(private x)`). Usar uniones de literales y asignar campos en el constructor. Privados con `#`.
- `verbatimModuleSyntax`: importar tipos con `import type`.
- Alias `@/` → `src/`. Imports directos por archivo (sin barrels).
- Montos: enteros en pesos (COP), nunca decimales.
- Las tarifas y límites de `config/miLlave.config.ts` son valores de referencia, no las tarifas oficiales.
- Persistencia: `localStorage` con clave `tu-llave:v1`; si se cambia el formato, subir `VERSION_DEL_ESQUEMA` en `serializacion.ts`. Si el JSON está corrupto se arranca vacío y se siembran los datos de demostración.
- Tarjetas de demostración: `1000123456789012` (activa, con historial) y `1000987654321098` (bloqueada). Tarjeta bancaria de prueba: `4111 1111 1111 1111`.
- Al agregar una regla o clase al dominio, agregar su prueba en `src/domain/dominio.test.ts` (o `src/app/miLlaveApp.test.ts` si toca la fachada o la persistencia).

## Interfaz

- Componentes **shadcn** (estilo `radix-nova`, base `radix`, iconos `lucide`). Reglas de la skill `shadcn`: `FieldGroup` + `Field` para formularios, `gap-*` en vez de `space-*`, colores semánticos (`bg-primary`, `text-muted-foreground`, nunca `bg-blue-500`), `cn()` para clases condicionales, `data-icon` en iconos de botones, `Alert`/`Empty`/`Badge` en vez de markup propio, `ToggleGroup` para 2–7 opciones.
- Tema en `src/index.css`: cobalto (`--primary`), ámbar de señal (`--signal`), verde (`--success`), fondo gris concreto frío. Tipografías: Bricolage Grotesque (títulos, saldo) y Figtree (texto). Solo tema claro.
- Elemento memorable: la tarjeta (`tarjeta-visual.tsx`) con la línea de ruta. Mantener el resto sobrio.
- Buenas prácticas React (skill `vercel-react-best-practices`): estado derivado en el render (sin `useEffect` para derivar), inicializador perezoso de `useState`, imports directos, sin componentes definidos dentro de componentes, ternarios en vez de `&&` para renderizado condicional.
- La UI no contiene reglas de negocio: solo elige qué clase de dominio instanciar (`crearMedioDePago`) y llama a la fachada `MiLlaveApp`.

## Skills del proyecto (`.claude/skills/`)

Usarlas: `shadcn` (componentes), `frontend-design` (dirección visual: decidir paleta/tipografía antes de codificar), `vercel-react-best-practices` (rendimiento React), `find-skills`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- El comando `graphify` no está en el PATH en esta máquina: usar `python -m graphify ...`.
