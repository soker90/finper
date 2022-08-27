// Cunado la request tiene mes, el array solo tiene una posición, si no, el array tiene 12 posiciones con los 12 meses.
const getBudgetIndex = (monthValue: number, requestMonth?: number) => requestMonth ? 0 : monthValue - 1

export const calcBudgetByMonths = ({ category, transactionsSum, month }: any) => {
  const budgets = month ? [{ amount: 0, real: 0 }] : Array.from({ length: 12 }, () => ({ amount: 0, real: 0 } as any))

  category.budgets.forEach(({ month: monthCategory, amount, budgetId }: any) => {
    const budgetIndex = getBudgetIndex(monthCategory, month)
    budgets[budgetIndex].amount = amount
    budgets[budgetIndex].budgetId = budgetId
  })

  transactionsSum.filter(({ _id }: any) => _id.category.toString() === category._id.toString()).forEach(({
    total,
    _id
  }: any) => {
    const budgetIndex = getBudgetIndex(_id.month, month)
    budgets[budgetIndex].real = total
  })

  return {
    name: category.name,
    id: category._id,
    budgets
  }
}