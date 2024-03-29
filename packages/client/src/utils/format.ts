import { capitalize } from 'utils/index'

export const euro = (cell: number, options = {}) => {
  const n = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  })
  return n.format(cell)
}

export const number = (cell: number, options = {}) => {
  const n = new Intl.NumberFormat('es-ES', {
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  })
  return n.format(cell)
}

export const dateShort = (cell: number) => {
  if (!cell) {
    return null
  }
  const d = new Date(cell)
  return d.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric'
  })
}

/* xD */
export const date = (cell: number) => {
  if (!cell) {
    return null
  }

  return new Date(cell).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export const monthToNumber = (month?: number | string): string => {
  if (!month && month !== 0) return ''
  const date = new Date()
  date.setMonth(+month, 1)

  const monthString = date.toLocaleString('es-ES', {
    month: 'long'
  })

  return capitalize(monthString)
}
