import { Budget } from 'types/budget'

export const isSameDate = (year?: string, month?: string): boolean => {
  const now = new Date()
  return (year === now.getFullYear().toString() && month === now.getMonth().toString())
}

export const getUrlMonth = (year = '0', month?: number) => {
  let newMonth = month
  let newYear = +year
  if (month === -1) {
    newMonth = 11
    newYear = newYear - 1
  }
  if (month === 12) {
    newMonth = 0
    newYear = newYear + 1
  }
  return `/presupuestos/${newYear}/${newMonth}`
}

export const sortByAmountAndName = (a: Budget, b: Budget) => {
  if (a.budgets[0].real < b.budgets[0].real) {
    return 1
  }
  if (a.budgets[0].real > b.budgets[0].real) {
    return -1
  }

  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
}
