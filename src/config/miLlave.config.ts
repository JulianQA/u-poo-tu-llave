/**
 * Valores configurables del simulador. Las tarifas y los límites de recarga cambian con
 * el tiempo, por eso viven aquí y no dentro de las clases del dominio.
 *
 * Son valores de referencia para el simulador, no las tarifas oficiales vigentes:
 * ajústalos según la resolución tarifaria que quieras representar.
 */
export const TARIFAS = {
  pasajes: {
    troncal: 3550,
    zonal: 3550,
    dual: 3550,
  },
  transbordo: {
    tarifa: 200,
    ventanaMinutos: 75,
    maximoTransbordos: 2,
  },
} as const

export const LIMITES_DE_RECARGA = {
  minimo: 3000,
  maximo: 200_000,
  saldoMaximo: 500_000,
} as const

export const PUNTOS_DE_RECARGA = [
  'Éxito Calle 80',
  'Tienda Alquería Kennedy',
  'Estación Portal Norte',
  'Punto Tu Llave Centro Comercial Andino',
] as const

export const BANCOS_PSE = ['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA', 'Nequi'] as const

export const ESTACIONES_TRONCALES = [
  { id: 'portal-norte', nombre: 'Portal Norte' },
  { id: 'calle-100', nombre: 'Calle 100' },
  { id: 'calle-72', nombre: 'Calle 72' },
  { id: 'heroes', nombre: 'Héroes' },
  { id: 'museo-del-oro', nombre: 'Museo del Oro' },
  { id: 'ricaurte', nombre: 'Ricaurte' },
  { id: 'portal-americas', nombre: 'Portal Américas' },
  { id: 'portal-sur', nombre: 'Portal Sur' },
  { id: 'portal-80', nombre: 'Portal 80' },
  { id: 'portal-tunal', nombre: 'Portal Tunal' },
] as const

export const PARADEROS_ZONALES = [
  { id: 'cra7-cll45', nombre: 'Carrera 7 con Calle 45' },
  { id: 'boyaca-cll80', nombre: 'Av. Boyacá con Calle 80' },
  { id: 'cll26-cra68', nombre: 'Calle 26 con Carrera 68' },
  { id: 'suba-cll127', nombre: 'Av. Suba con Calle 127' },
  { id: 'cll13-cra50', nombre: 'Calle 13 con Carrera 50' },
  { id: 'cll170-autonorte', nombre: 'Calle 170 con Autopista Norte' },
] as const
