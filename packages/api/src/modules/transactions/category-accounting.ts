import { TRANSACTION } from '@soker90/finper-db'

/** Returns the signed amount for category-based reporting, independently of bank balance impact. */
export const getCategoryAccountingAmount = ({
  categoryType,
  type,
  amount
}: { categoryType: string | null | undefined, type: string, amount: number }): number => {
  if (type === TRANSACTION.NotComputable) return 0

  if (categoryType === TRANSACTION.Expense) {
    if (type === TRANSACTION.Expense) return amount
    if (type === TRANSACTION.Income) return -amount
  }

  if (categoryType === TRANSACTION.Income && type === TRANSACTION.Income) return amount
  return 0
}
