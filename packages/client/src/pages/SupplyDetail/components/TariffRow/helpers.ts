export const calculateSavings = (
  currentAmount: number,
  newAmount: number
): { difference: number; isSaving: boolean } => {
  const difference = currentAmount - newAmount
  return { difference, isSaving: difference > 0 }
}

export const getSavingsLabel = (savings: number): 'saving' | 'cost' =>
  savings > 0 ? 'saving' : 'cost'

export const getRowBackground = (isBest: boolean) => ({
  bgcolor: isBest ? 'success.lighter' : 'inherit',
  '&:hover': { bgcolor: isBest ? 'success.lighter' : 'action.hover' }
})

export const getPriceTitleColor = (isBest: boolean): 'success.main' | 'text.primary' =>
  isBest ? 'success.main' : 'text.primary'

export const getPriceTextColor = (isBest: boolean): number =>
  isBest ? 700 : 600

export const getSavingsColor = (savings: number): 'success.main' | 'error.main' =>
  savings > 0 ? 'success.main' : 'error.main'
