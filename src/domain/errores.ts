/**
 * Jerarquía de excepciones del dominio.
 * Toda regla de negocio violada se expresa con una subclase de `ErrorDeDominio`,
 * de modo que la interfaz pueda distinguirlas de errores inesperados con `instanceof`.
 */
export class ErrorDeDominio extends Error {}

/** Datos de entrada mal formados (nombre vacío, número de tarjeta inválido, etc.). */
export class DatosInvalidosError extends ErrorDeDominio {}

/** El monto no es un entero positivo o incumple los límites configurados. */
export class MontoInvalidoError extends ErrorDeDominio {}

export class SaldoInsuficienteError extends ErrorDeDominio {
  readonly saldo: number
  readonly requerido: number

  constructor(saldo: number, requerido: number) {
    super(
      `Saldo insuficiente: la tarifa es de $${requerido.toLocaleString('es-CO')} y la tarjeta tiene $${saldo.toLocaleString('es-CO')}.`,
    )
    this.saldo = saldo
    this.requerido = requerido
  }
}

export class TarjetaBloqueadaError extends ErrorDeDominio {
  constructor(numero: string) {
    super(`La tarjeta ${numero} está bloqueada. Actívala para poder usarla.`)
  }
}

export class TarjetaNoEncontradaError extends ErrorDeDominio {
  constructor(numero: string) {
    super(`No existe una tarjeta con el número ${numero}.`)
  }
}

/** El medio de pago rechazó la transacción. */
export class PagoRechazadoError extends ErrorDeDominio {}

/** La estación o paradero no pertenece al servicio del lector. */
export class PuntoNoAdmitidoError extends ErrorDeDominio {}
