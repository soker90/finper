import { useForm } from 'react-hook-form'
import { InputForm, ModalGrid } from 'components'
import { editBudget } from 'services/apiService'
import { mutate } from 'swr'
import { BUDGETS } from 'constants/api-paths'

interface Props {
  onClose: () => void
  budget: { category: string, amount: number }
  year: string
  month: string
}

const ModalEdit = ({ onClose, budget, year, month }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      amount: budget.amount
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await editBudget({ category: budget.category, ...params, month, year })
    if (!error) {
      mutate(`${BUDGETS}?year=${year}&month=${month}`)
      onClose()
    }
  })

  return (
    <form onSubmit={onSubmit}>
      <ModalGrid title='Editar cantidad' onClose={onClose} show={Boolean(budget)} action={onSubmit}>
        <InputForm
          label='Cantidad' id='amount'
          error={!!errors.amount} {...register('amount', { required: true, valueAsNumber: true })}
          errorText='Introduce un número válido' type='number' inputProps={{ step: 'any' }}
          size={12}
        />

      </ModalGrid>
    </form>
  )
}

export default ModalEdit
