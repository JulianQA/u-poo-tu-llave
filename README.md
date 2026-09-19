# Tu Llave

Simulador de la tarjeta de transporte Tu Llave (Bogotá) para la materia de Programación Orientada a Objetos, UNIMINUTO.

El dominio (tarjetas, movimientos, medios de pago, servicios de transporte, lector) es TypeScript plano en `src/domain/`, sin dependencias de React. La interfaz (React + shadcn/ui) solo dibuja pantallas y llama a la fachada `MiLlaveApp`.

```
bun install
bun dev          # servidor de desarrollo
bun run test     # pruebas del dominio
bun run build    # build de producción
```

La arquitectura, el modelo de dominio y las convenciones están en [CLAUDE.md](CLAUDE.md).
