import { useForm } from 'react-hook-form'
import { InputForm, ModalGrid } from 'components'
import { editBudget } from 'services/apiService'
import { mutate } from 'swr'
import { DEBTS } from 'constants/api-paths'
import { Debt } from 'types/debt'

interface Props {
    onClose: () => void
    debt: Debt
}

const ModalEditDebt = ({ onClose, debt }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: window.structuredClone(debt)
  })

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await editBudget({ category: budget.category, ...params, month, year })
    if (!error) {
      mutate(`${DEBTS}`)
      onClose()
    }
  })

  return <form onSubmit={onSubmit}>
        <ModalGrid title='Editar cantidad' onClose={onClose} show={Boolean(debt)} action={onSubmit}>
            <InputForm label='Cantidad' id='amount'
                       error={!!errors.amount} {...register('amount', { required: true, valueAsNumber: true })}
                       errorText='Introduce un número válido' type='number' inputProps={{ step: 'any' }}/>

        </ModalGrid>
    </form>
}

export default ModalEditDebt
