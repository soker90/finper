import { capitalize } from 'utils/index'

const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})

const numberFormatter = new Intl.NumberFormat('es-ES', {
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})

export const euro = (cell: number, options?: Intl.NumberFormatOptions) => {
  if (!options) return euroFormatter.format(cell)
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(cell)
}

export const number = (cell: number, options?: Intl.NumberFormatOptions) => {
  if (!options) return numberFormatter.format(cell)
  return new Intl.NumberFormat('es-ES', {
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(cell)
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

export const monthShort = (month: number): string => {
  const d = new Date()
  d.setMonth(month, 1)
  return capitalize(d.toLocaleString('es-ES', { month: 'short' }))
}

export const monthsDiff = (months: number): string => {
  if (months <= 0) return '0 meses'
  const years = Math.floor(months / 12)
  const remaining = months % 12
  if (years === 0) return `${remaining} mes${remaining !== 1 ? 'es' : ''}`
  if (remaining === 0) return `${years} año${years !== 1 ? 's' : ''}`
  return `${years} año${years !== 1 ? 's' : ''} y ${remaining} mes${remaining !== 1 ? 'es' : ''}`
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
