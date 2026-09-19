/** Identificador único legible para movimientos y comprobantes. */
export function nuevoId(prefijo: string): string {
  return `${prefijo}-${globalThis.crypto.randomUUID().slice(0, 8).toUpperCase()}`
}
