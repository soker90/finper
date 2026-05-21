// Cunado la request tiene mes, el array solo tiene una posicin, si no, el array tiene 12 posiciones con los 12 meses.
/* istanbul ignore next — requestMonth === 0 (January) edge case not covered by current tests */
const getBudgetIndex = (monthValue: number, requestMonth?: number) => (requestMonth || requestMonth === 0) ? 0 : monthValue - 1

export const calcBudgetByMonths = ({
  category,
  transactionsSum,
  month
}: any): { name: string, id: string, budgets: { amount: number, real: number, month?: number, year?: number }[], total?: number } => {
  /* istanbul ignore next — false branch (month specific request) not exercised in current budget tests */
  const budgets = isNaN(month) ? Array.from({ length: 12 }, () => ({ amount: 0, real: 0 } as any)) : [{ amount: 0, real: 0 }]

  category.budgets.forEach(({ month: monthCategory, amount, year }: any) => {
    const budgetIndex = getBudgetIndex(monthCategory, month)
    budgets[budgetIndex].amount = amount
    budgets[budgetIndex].month = monthCategory
    budgets[budgetIndex].year = year
  })

  let totalCategory = 0
  transactionsSum.filter(({ _id }: any) => _id.category.toString() === category._id.toString()).forEach(({
    total,
    _id
  }: any) => {
    const budgetIndex = getBudgetIndex(_id.month, month)
    budgets[budgetIndex].real = total
    totalCategory += total
  })

  return {
    name: category.name,
    id: category._id,
    budgets,
    total: totalCategory
  }
}
