import { ErrorDeDominio } from '@/domain/errores'

/** Las reglas de negocio ya traen un mensaje pensado para la persona; cualquier otro error es un fallo inesperado. */
export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorDeDominio ? error.message : 'Ocurrió un error inesperado. Intenta de nuevo.'
}
