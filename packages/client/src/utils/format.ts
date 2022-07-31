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
