import type { CreditCardMovement } from 'types'
import type { SplitFormValue } from 'hooks'

/** Signed amount of a credit card movement: expenses increase debt (positive),
 * income/refunds reduce debt (negative). */
export const netAmount = (movement: Pick<CreditCardMovement, 'amount' | 'type'>): number =>
  movement.type === 'expense' ? movement.amount : -movement.amount

export interface MovementFormValues {
  date: number | null
  amount: string
  type: 'expense' | 'income'
  categoryId: string
  storeId: string
  note: string
  tags: string[]
  splits: SplitFormValue[]
}

/** Builds the API payload for creating/editing a credit card movement,
 * resolving the split-mode fields (categoryId/tags/splits) into their final
 * shape. `splits` is always included (empty array when not split) so that
 * disabling split mode on an existing split movement tells the server to
 * remove the existing lines instead of being silently ignored. */
export const buildMovementPayload = ({ data, hasSplits, fallbackDate }: {
  data: MovementFormValues
  hasSplits: boolean
  fallbackDate?: number
}) => ({
  date: data.date ? new Date(data.date).getTime() : (fallbackDate ?? Date.now()),
  amount: parseFloat(data.amount),
  type: data.type,
  categoryId: hasSplits ? data.splits[0].category : data.categoryId,
  storeId: data.storeId || null,
  note: data.note.trim() || null,
  tags: hasSplits ? [] : data.tags,
  splits: hasSplits
    ? data.splits.map(split => ({
      categoryId: split.category,
      amount: Number(split.amount),
      ...(split.tags?.length && { tags: split.tags })
    }))
    : []
})
