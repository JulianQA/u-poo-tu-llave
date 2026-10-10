# Ciclo de vida del software — Tu Llave

Este documento recorre las fases del ciclo de vida del simulador Tu Llave: análisis de requisitos, diseño, implementación, pruebas, despliegue y mantenimiento. Para cada una se indica su objetivo, lo que se hizo en el proyecto y lo que quedó como resultado.

## 1. Análisis de requisitos

**Objetivo:** definir qué debe hacer el simulador y bajo qué restricciones, antes de decidir cómo construirlo.

El sistema simula la tarjeta Tu Llave del transporte público de Bogotá. Un usuario tiene una o más tarjetas, las recarga con distintos medios de pago y las usa para pagar viajes en TransMilenio y en el SITP.

### Requisitos funcionales

| ID    | Requisito                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| RF-01 | Consultar una tarjeta por su número de 16 dígitos: titular, estado, saldo y últimos movimientos, sin cobrar nada.                 |
| RF-02 | Recargar una tarjeta en un punto de recarga (efectivo), por PSE o con tarjeta débito/crédito, y entregar un comprobante.            |
| RF-03 | Validar un viaje en TransMilenio (estaciones), SITP zonal (paraderos) o SITP dual (ambos), descontando la tarifa del servicio.      |
| RF-04 | Aplicar tarifa de transbordo cuando el viaje ocurre dentro de la ventana de tiempo, en un punto distinto y sin superar el máximo.   |
| RF-05 | Bloquear y reactivar una tarjeta. Una tarjeta bloqueada no puede recargarse ni usarse para viajar.                                |
| RF-06 | Consultar el historial de movimientos, ordenado por fecha y filtrable por tipo (recarga o viaje) y por rango de fechas.           |
| RF-07 | Conservar los datos entre sesiones del navegador.                                                                                 |

### Reglas de negocio

- El saldo es un entero en pesos y nunca queda negativo. Si no alcanza para la tarifa, el viaje se rechaza.
- Una recarga debe estar entre el mínimo y el máximo configurados, y el saldo resultante no puede pasar del saldo máximo. Valores de referencia: $3.000, $200.000 y $500.000.
- En un punto de recarga en efectivo solo se reciben múltiplos de $1.000. PSE exige un correo válido. La tarjeta bancaria debe pasar el algoritmo de Luhn, no estar vencida y tener un CVV de 3 o 4 dígitos.
- Si el medio de pago rechaza el cobro, la tarjeta no cambia.
- Transbordo: ventana de 75 minutos, tarifa reducida de $200 y como máximo 2 transbordos encadenados (valores de referencia). TransMilenio no da transbordo de troncal a troncal y dos viajes duales seguidos tampoco cuentan como transbordo.
- Las tarifas pueden cambiar sin modificar el código de las clases.

### Requisitos no funcionales

| ID     | Requisito                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| RNF-01 | El modelo de dominio debe poder ejecutarse y probarse sin interfaz gráfica.                                  |
| RNF-02 | Toda violación de una regla de negocio se informa con una excepción propia del dominio y un mensaje claro.   |
| RNF-03 | Las tarifas, los límites y el catálogo de estaciones y paraderos son configurables.                          |
| RNF-04 | Código, interfaz y mensajes en español.                                                                      |
| RNF-05 | Aplicación web que funcione en un navegador moderno, sin servidor propio.                                    |

**Resultado de la fase:** la lista de requisitos y reglas anterior, que después se convirtió en casos de prueba (ver fase 4).

## 2. Diseño

**Objetivo:** decidir la estructura del sistema para cumplir los requisitos, con énfasis en el modelo orientado a objetos.

### Arquitectura por capas

El sistema se divide en capas con una regla de dependencias estricta: `components → context → app → domain` e `infrastructure → domain`. La capa `domain` no depende de ninguna otra, lo que permite probarla sola (RNF-01).

| Capa             | Responsabilidad                                                                       |
| ---------------- | ------------------------------------------------------------------------------------- |
| `domain`         | Clases del negocio y sus reglas. TypeScript plano, sin React ni navegador.            |
| `infrastructure` | Persistencia: repositorio en memoria y en `localStorage`, serialización a JSON.       |
| `config`         | Tarifas, límites de recarga y catálogo de estaciones, paraderos y bancos.             |
| `app`            | Fachada `MiLlaveApp` y composición de dependencias.                                   |
| `context`        | Conecta la fachada con React.                                                          |
| `components`     | Pantallas.                                                                            |

### Modelo de dominio

El diagrama de clases del dominio está en [UML.md](UML.md). Las decisiones principales fueron estas:

- **Abstracción y herencia.** `Movimiento` es abstracta y tiene dos subclases, `Recarga` y `Viaje`. Lo mismo pasa con `MedioDePago` (`PuntoDeRecarga`, `PSE`, `TarjetaBancaria`), `ServicioDeTransporte` (`TransMilenio`, `SitpZonal`, `ServicioDual`) y `PuntoDeAcceso` (`Estacion`, `Paradero`).
- **Polimorfismo.** El procesador de recargas trabaja con cualquier `MedioDePago` sin saber cuál es, y el lector trabaja con cualquier `ServicioDeTransporte`. Cada subclase responde a su manera a `verificar`, `admite` o `efectoEnSaldo`.
- **Encapsulamiento.** El saldo, el estado y los movimientos de `TarjetaMiLlave` son campos privados. Solo cambian con `registrarRecarga` y `registrarViaje`, que validan las reglas y siempre dejan un movimiento como rastro.
- **Excepciones.** Todas heredan de `ErrorDeDominio`, así la interfaz las distingue de un error inesperado (RNF-02).

### Patrones aplicados

| Patrón                       | Dónde                                                       | Para qué                                                                    |
| ---------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| Método plantilla             | `MedioDePago.autorizar`, `ServicioDeTransporte.calcularTarifa` | El flujo es común; cada subclase cambia solo el paso que le corresponde.  |
| Fachada                      | `MiLlaveApp`                                                | La interfaz solo conoce esta clase.                                         |
| Repositorio (puerto)         | `RepositorioDeTitulares`                                    | El dominio no sabe cómo ni dónde se guardan los datos.                      |
| Inyección de dependencias    | `Reloj`, `TablaDeTarifas`, repositorio                      | Se pueden reemplazar en las pruebas y cambiar las tarifas en caliente.      |
| Observador                   | `MiLlaveApp.suscribir`                                      | La interfaz se redibuja cuando cambian los datos.                           |

**Resultado de la fase:** la arquitectura por capas y el diagrama de clases UML.

## 3. Implementación

**Objetivo:** construir el sistema siguiendo el diseño.

### Tecnologías

| Herramienta                        | Uso                                             |
| ---------------------------------- | ----------------------------------------------- |
| TypeScript 6                       | Lenguaje de todo el proyecto                    |
| React 19 + shadcn/ui + Tailwind 4  | Interfaz                                        |
| Vite 8                             | Servidor de desarrollo y build                  |
| Vitest 5                           | Pruebas                                         |
| oxlint                             | Análisis estático                               |
| bun                                | Gestor de paquetes y ejecución de scripts       |

### Orden de construcción

1. **Dominio.** Primero las clases de `src/domain/` con sus pruebas, sin ninguna pantalla.
2. **Persistencia.** El repositorio en memoria y después el de `localStorage`, que hereda del primero y solo agrega la lectura y escritura del JSON.
3. **Fachada y composición.** `MiLlaveApp` coordina las operaciones y `composicion.ts` crea los objetos con los valores de `config/`.
4. **Interfaz.** La tarjeta visual, el lector, los paneles de recarga, viaje y movimientos, y el diálogo del comprobante.

### Convenciones

- Sin `enum` ni propiedades de parámetro (el `tsconfig` usa `erasableSyntaxOnly`): se usan uniones de literales y los campos se asignan en el constructor.
- Los campos privados usan `#`.
- Montos como enteros en pesos, nunca con decimales.
- Ninguna tarifa queda escrita dentro de una clase: todas vienen de `TablaDeTarifas`.
- El dominio no llama a `new Date()` para sus reglas: recibe un `Reloj`.

**Resultado de la fase:** el código fuente en `src/` y una aplicación que funciona con `bun dev`.

## 4. Pruebas

**Objetivo:** comprobar que el sistema cumple los requisitos y las reglas de negocio.

Las pruebas son unitarias y de integración, con Vitest en entorno Node, sin navegador. Que el dominio no dependa de la interfaz es lo que permite probarlo así. Para las reglas de transbordo se usa un reloj fijo, de modo que los resultados no dependen de la hora en que se corran.

| Archivo                         | Qué cubre                                                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/dominio.test.ts`    | Creación y encapsulamiento de la tarjeta, bloqueo, polimorfismo de movimientos y medios de pago, límites de recarga, rechazo del pago sin tocar la tarjeta, lector y saldo insuficiente, puntos admitidos, tarifas configurables, transbordos e historial. |
| `src/app/miLlaveApp.test.ts`    | Operaciones completas a través de la fachada, aviso a los suscriptores y persistencia: lo guardado se restaura igual y un JSON corrupto no rompe la aplicación.                                                                                     |

Relación entre requisitos y pruebas:

| Requisito          | Pruebas que lo verifican                                                     |
| ------------------ | ---------------------------------------------------------------------------- |
| RF-01              | `Lector › leer no cobra`, `MiLlaveApp › lee una tarjeta de demostración`     |
| RF-02              | `ProcesadorDeRecargas`, `Medios de pago`                                     |
| RF-03              | `Lector`, `MiLlaveApp › solo ofrece los puntos que cada servicio atiende`    |
| RF-04              | `Tarifas y transbordos`                                                      |
| RF-05              | `TarjetaMiLlave › bloquea y reactiva`, `Lector › TarjetaBloqueadaError`      |
| RF-06              | `HistorialDeMovimientos`                                                     |
| RF-07              | `Persistencia en JSON`                                                       |
| RNF-03             | `Tarifas y transbordos › las tarifas son configurables`                      |

Se ejecutan con `bun run test`. Resultado actual: 2 archivos y 36 pruebas, todas aprobadas. Además, `bun run lint` revisa el código y `bun run build` compila con el verificador de tipos de TypeScript, que también detecta errores.

**Resultado de la fase:** la suite de pruebas automatizadas y su ejecución sin fallos.

## 5. Despliegue

**Objetivo:** dejar el sistema listo para que otra persona lo use.

Tu Llave es una aplicación web estática: no tiene servidor ni base de datos, porque los datos quedan en el `localStorage` del navegador.

1. Instalar dependencias: `bun install`.
2. Generar el build de producción: `bun run build`. Primero compila con `tsc` y luego Vite genera los archivos optimizados en `dist/`.
3. Revisar el build localmente: `bun run preview`.
4. Publicar la carpeta `dist/` en cualquier hosting de sitios estáticos.

La primera vez que se abre la aplicación se crean datos de demostración: la tarjeta `1000123456789012` (activa, con historial) y la `1000987654321098` (bloqueada). Para probar el pago con tarjeta bancaria se usa el número de prueba `4111 1111 1111 1111`. Si el navegador no permite usar `localStorage`, la aplicación sigue funcionando en memoria.

**Resultado de la fase:** la carpeta `dist/` con la aplicación lista para publicar.

## 6. Mantenimiento

**Objetivo:** mantener el sistema correcto y adaptarlo a cambios sin romper lo que ya funciona.

El diseño está pensado para que los cambios más probables toquen pocos archivos:

| Cambio                                        | Qué hay que hacer                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Nueva tarifa o nuevos límites de recarga      | Editar `src/config/miLlave.config.ts`. No se toca ninguna clase.                                                                          |
| Nueva estación o paradero                     | Agregarlo al catálogo en `src/config/miLlave.config.ts`.                                                                                  |
| Nuevo medio de pago (por ejemplo, Nequi)      | Crear una subclase de `MedioDePago` que implemente `tipo`, `nombre` y `verificar`. El procesador de recargas no cambia.                    |
| Nuevo servicio de transporte                  | Crear una subclase de `ServicioDeTransporte` que implemente `tipo` y `admite` y, si hace falta, `admiteTransbordoDesde`.                   |
| Otro tipo de almacenamiento (por ejemplo, una API) | Implementar `RepositorioDeTitulares` en `infrastructure/` y elegirlo en `composicion.ts`. El dominio no cambia.                     |
| Cambio en el formato de los datos guardados   | Subir `VERSION_DEL_ESQUEMA` en `serializacion.ts` (hoy es 1). Los datos con otra versión se ignoran y se vuelven a sembrar los de demostración. |

Cada vez que se cambia algo:

1. Se agrega o ajusta la prueba correspondiente y se corre `bun run test`.
2. Se corren `bun run lint` y `bun run build`.
3. Si cambió el modelo, se actualiza [UML.md](UML.md).
4. Se registra el cambio en git con un mensaje en español.

**Resultado de la fase:** un sistema que se puede extender agregando clases, sin modificar las que ya existen.
