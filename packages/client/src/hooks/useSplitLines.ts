import { useState } from 'react'
import { useFieldArray, type Control, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { roundMoney } from 'utils'

export type SplitFormValue = { category: string, amount: number | '', tags: string[] }

interface UseSplitLinesParams {
  control: Control<any>
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  categoryFieldName: string
  initialSplitMode: boolean
}

// Compartido por TransactionEdit, CreditCardMovementEdit y ModalMovement: mismo
// formulario de "dividir movimiento" con distinto nombre de campo de categoría.
export const useSplitLines = ({ control, watch, setValue, categoryFieldName, initialSplitMode }: UseSplitLinesParams) => {
  const [splitMode, setSplitMode] = useState(initialSplitMode)
  const { fields, append, remove } = useFieldArray({ control, name: 'splits' })

  const watchedAmount = Number(watch('amount') || 0)
  const watchedSplits: SplitFormValue[] = watch('splits') || []
  const watchedCategory = watch(categoryFieldName)
  const watchedTags = watch('tags')

  const assigned = roundMoney(watchedSplits.reduce((sum, split) => sum + (Number(split.amount) || 0), 0))
  const remaining = roundMoney(watchedAmount - assigned)

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

  return { splitMode, setSplitMode, fields, append, remove, remaining, enableSplitMode, disableSplitMode, assignRemaining }
}
