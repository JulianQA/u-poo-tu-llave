import { DatosInvalidosError, MontoInvalidoError } from './errores'

/** Los montos se manejan en pesos enteros (COP no usa centavos en Tu Llave). */
export function validarMonto(monto: number, etiqueta = 'El monto'): void {
  if (!Number.isInteger(monto) || monto <= 0) {
    throw new MontoInvalidoError(`${etiqueta} debe ser un número entero de pesos mayor que cero.`)
  }
}

export function validarTextoNoVacio(valor: string, etiqueta: string): string {
  const limpio = valor.trim()
  if (limpio === '') throw new DatosInvalidosError(`${etiqueta} es obligatorio.`)
  return limpio
}

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function esCorreoValido(correo: string): boolean {
  return PATRON_CORREO.test(correo.trim())
}

export function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`
}
