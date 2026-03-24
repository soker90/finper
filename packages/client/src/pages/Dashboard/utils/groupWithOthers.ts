export interface RankedItem {
  name: string
  amount: number
}

export const OTHERS_LABEL = 'Otros'
export const OTHERS_COLOR = '#bdbdbd'

/**
 * Rota un array de colores por un offset, de forma que colorOffset=2 hace
 * que el índice 0 tome el color que antes era el 2.
 */
export const rotateColors = (colors: string[], offset: number): string[] => {
  if (offset === 0) return colors
  return [...colors.slice(offset), ...colors.slice(0, offset)]
}

/**
 * Agrupa los items cuyo peso relativo sobre el total sea menor que `threshold`
 * en un único ítem "Otros". Si no hay ninguno por debajo del umbral devuelve
 * la lista original sin modificar.
 */
export const groupWithOthers = (items: RankedItem[], threshold = 0.05): RankedItem[] => {
  if (items.length === 0) return items

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  if (total === 0) return items

  const visible: RankedItem[] = []
  let othersAmount = 0

  for (const item of items) {
    if (item.amount / total >= threshold) {
      visible.push(item)
    } else {
      othersAmount += item.amount
    }
  }

  if (othersAmount > 0) {
    visible.push({ name: OTHERS_LABEL, amount: othersAmount })
  }

  return visible
}
