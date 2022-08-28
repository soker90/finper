import { useForm } from 'react-hook-form'
import { InputForm, ModalGrid } from 'components'
import { editBudget } from 'services/apiService'
import { mutate } from 'swr'
import { BUDGETS } from 'constants/api-paths'

const ModalEdit = ({ onClose, budget }: any) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      amount: budget.amount

    }
  })

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await editBudget({ ...budget, ...params })
    if (!error) {
      mutate(BUDGETS)
      onClose()
    }
  })

  return <form onSubmit={onSubmit}>
        <ModalGrid title='Editar cantidad' onClose={onClose} show={Boolean(budget)}
                   action={() => console.log('submit')}>
            <InputForm label='Cantidad' id={'pep'} placeholder={''}
                       defaultValue={budget.amount}
                       error={!!errors.amount} {...register('amount', { required: true, valueAsNumber: true })}
                       errorText='Introduce un número válido' type='number' inputProps={{ step: 'any' }}/>

        </ModalGrid>
    </form>
}

export default ModalEdit
