import { useForm } from 'react-hook-form'
import { mutate } from 'swr'
import { Goal } from 'types'
import { InputForm } from 'components'
import ModalGrid from 'components/modals/ModalGrid'
import { fundGoal, withdrawGoal } from 'services/apiService'
import { GOALS } from 'constants/api-paths'
import { format } from 'utils'

interface GoalFundDialogProps {
  goal: Goal
  open: boolean
  onClose: () => void
  mode: 'fund' | 'withdraw'
}

interface FormValues {
  amount: string
}

const GoalFundDialog = ({ goal, open, onClose, mode }: GoalFundDialogProps) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { amount: '' }
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async ({ amount }) => {
    const numAmount = Number(amount)
    const { error: apiError } = mode === 'fund'
      ? await fundGoal(goal._id as string, numAmount)
      : await withdrawGoal(goal._id as string, numAmount)

    if (!apiError) {
      mutate(GOALS)
      reset()
      onClose()
    }
  })

  const title = mode === 'fund'
    ? `Añadir fondos: ${goal.name} (${format.euro(goal.currentAmount)} / ${format.euro(goal.targetAmount)})`
    : `Retirar fondos: ${goal.name} (${format.euro(goal.currentAmount)} / ${format.euro(goal.targetAmount)})`

  return (
    <ModalGrid
      show={open}
      onClose={handleClose}
      title={title}
      action={onSubmit}
    >
      <InputForm
        id='amount'
        label='Cantidad'
        type='number'
        inputProps={{ step: 'any', min: 0.01 }}
        error={!!errors.amount}
        errorText='Introduce una cantidad válida'
        size={12}
        {...register('amount', { required: true, min: 0.01, valueAsNumber: false })}
      />
    </ModalGrid>
  )
}

export default GoalFundDialog
