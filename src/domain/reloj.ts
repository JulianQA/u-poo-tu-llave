/**
 * Abstracción del tiempo. El dominio nunca llama a `new Date()` directamente:
 * así las pruebas pueden fijar la hora y las reglas de transbordo son verificables.
 */
export interface Reloj {
  ahora(): Date
}

export class RelojDelSistema implements Reloj {
  ahora(): Date {
    return new Date()
  }
}
