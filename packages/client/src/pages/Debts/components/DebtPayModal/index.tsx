import { useForm } from 'react-hook-form'
import { mutate } from 'swr'

import { InputForm, ModalGrid } from 'components'
import { DEBTS } from 'constants/api-paths'
import { payDebt } from 'services/apiService'
import { Debt } from 'types'

interface FormValues {
  amount: number
}

const DebtPayModal = ({
  debt,
  onClose
}: { debt: Debt, onClose: () => void }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>()

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await payDebt(debt._id as string, params.amount)
    if (!error) {
      await mutate(DEBTS)
      onClose()
    }
  })

  return (
    <ModalGrid show onClose={onClose} title={`Abonar deuda — ${debt.from}`} action={onSubmit} actionDisabled={isSubmitting} cardSx={{ minWidth: 480 }}>
      <InputForm
        id='amount'
        label='Importe abonado'
        placeholder={`Pendiente: ${debt.amount}€`}
        type='number'
        inputProps={{ step: 'any', min: 0.01 }}
        error={!!errors.amount}
        errorText='Introduce un importe válido'
        size={12}
        {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })}
      />
    </ModalGrid>
  )
}

export default DebtPayModal
