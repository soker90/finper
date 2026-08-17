import { BANK_KEYS } from 'components'

// Etiquetas legibles para las claves registradas en components/icons/BankIcon,
// que es la fuente de verdad de qué bancos tienen logo disponible.
const BANK_LABELS: Record<string, string> = {
  bbva: 'BBVA',
  sabadell: 'Sabadell',
  bankinter: 'Bankinter',
  openbank: 'Openbank',
  unicaja: 'Unicaja',
  n26: 'N26',
  imagin: 'Imagin',
  revolut: 'Revolut',
  paypal: 'PayPal',
  amazon: 'Amazon',
  waylet: 'Waylet',
  eci: 'El Corte Inglés',
  gourmet: 'Gourmet',
  efectivo: 'Efectivo'
}

export const BANK_OPTIONS = BANK_KEYS.map((value) => ({ value, label: BANK_LABELS[value] ?? value }))
