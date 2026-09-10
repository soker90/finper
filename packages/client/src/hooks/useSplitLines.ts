import { useState } from 'react'
import { useFieldArray, type Control, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { roundMoney } from 'utils'

export type SplitFormValue = { category: string, amount: number | '', tags: string[] }

/** Shared by TransactionEdit, CreditCardMovementEdit and ModalMovement: each
 * domain stores a split line's category under a different field (`category._id`
 * in transactions, `categoryId` in credit card movements), so `getCategory`
 * extracts that value in a domain-agnostic way. */
export const mapExistingSplits = <T extends { amount: number, tags?: string[] | null }>(
  splits: T[] | undefined,
  getCategory: (split: T) => string
): SplitFormValue[] =>
    splits && splits.length >= 2
      ? splits.map(split => ({
        category: getCategory(split),
        amount: split.amount as number | '',
        tags: split.tags || []
      }))
      : []

interface UseSplitLinesParams {
  control: Control<any>
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  categoryFieldName: string
  initialSplitMode: boolean
}

// Shared by TransactionEdit, CreditCardMovementEdit and ModalMovement: same
// "split movement" form, with a different category field name per domain.
export const useSplitLines = ({ control, watch, setValue, categoryFieldName, initialSplitMode }: UseSplitLinesParams) => {
  const [splitMode, setSplitMode] = useState(initialSplitMode)
  const { fields, append, remove } = useFieldArray({ control, name: 'splits' })

  const watchedAmount = Number(watch('amount') || 0)
  const watchedSplits: SplitFormValue[] = watch('splits') || []
  const watchedCategory = watch(categoryFieldName)
  const watchedTags = watch('tags')

  const assigned = roundMoney(watchedSplits.reduce((sum, split) => sum + (Number(split.amount) || 0), 0))
  const remaining = roundMoney(watchedAmount - assigned)
  const hasSplits = splitMode && watchedSplits.length >= 2
  const isAmountMismatch = hasSplits && remaining !== 0

  const enableSplitMode = () => {
    setSplitMode(true)
    if (fields.length === 0) {
      append({ category: watchedCategory || '', amount: watchedAmount || '', tags: watchedTags || [] })
      append({ category: '', amount: '', tags: [] })
      setValue('tags', [])
    }
  }

  const disableSplitMode = () => {
    setSplitMode(false)
    const firstLineTags = watchedSplits[0]?.tags
    if (firstLineTags?.length) setValue('tags', firstLineTags)
    setValue('splits', [])
  }

  const assignRemaining = () => {
    if (fields.length === 0) return
    const lastIndex = fields.length - 1
    const others = roundMoney(watchedSplits
      .filter((_, index) => index !== lastIndex)
      .reduce((sum, split) => sum + (Number(split.amount) || 0), 0))
    setValue(`splits.${lastIndex}.amount`, roundMoney(watchedAmount - others))
  }

  return {
    splitMode,
    setSplitMode,
    fields,
    append,
    remove,
    remaining,
    hasSplits,
    isAmountMismatch,
    enableSplitMode,
    disableSplitMode,
    assignRemaining
  }
}
