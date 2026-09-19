const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const FORMATO_FECHA_LARGA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' })

export function formatearFecha(fecha: Date): string {
  return FORMATO_FECHA.format(fecha)
}

export function formatearFechaLarga(fecha: Date): string {
  return FORMATO_FECHA_LARGA.format(fecha)
}

/** 1000123456789012 → "1000 1234 5678 9012" */
export function agruparNumeroDeTarjeta(numero: string): string {
  return numero.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** Convierte lo que escribe la persona ("20.000", "20000") en un número; NaN si no es válido. */
export function leerMonto(texto: string): number {
  const limpio = texto.replace(/[.\s$]/g, '')
  return limpio === '' ? NaN : Number(limpio)
}
