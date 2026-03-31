import { useForm } from 'react-hook-form'

import { DateForm, InputForm, ModalGrid } from 'components'
import { addLoanEvent } from 'services/apiService'
import { Loan } from 'types'

import { useApiError, useLoanMutate } from '../../hooks'
import { inputToTimestamp } from '../../utils/date'

interface Props {
  loan: Loan
  onClose: () => void
}

interface FormValues {
  date: string | null
  newRate: number
  newPayment: number
}

const LoanEventModal = ({ loan, onClose }: Props) => {
  const { setApiError, ApiErrorMessage } = useApiError()
  const { revalidate } = useLoanMutate(loan._id)
  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<FormValues>({
    defaultValues: { date: null, newRate: loan.interestRate, newPayment: loan.monthlyPayment }
  })

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await addLoanEvent(loan._id, {
      date: params.date ? inputToTimestamp(params.date) : Date.now(),
      newRate: Number(params.newRate),
      newPayment: Number(params.newPayment)
    })
    if (error) { setApiError(error); return }
    await revalidate()
    onClose()
  })

  return (
    <ModalGrid show onClose={onClose} title='Registrar cambio de tipo / cuota' action={onSubmit} actionDisabled={isSubmitting}>
      <DateForm
        id='date'
        label='Fecha del cambio'
        placeholder='Fecha del cambio'
        error={!!errors.date}
        control={control}
        size={4}
      />
      <InputForm
        id='newRate'
        label='Nuevo TIN anual (%)'
        type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.newRate}
        errorText='TIN requerido'
        {...register('newRate', { required: true, valueAsNumber: true })}
      />
      <InputForm
        id='newPayment'
        label='Nueva cuota mensual'
        type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.newPayment}
        errorText='Cuota requerida'
        {...register('newPayment', { required: true, valueAsNumber: true })}
      />
      {ApiErrorMessage}
    </ModalGrid>
  )
}

export default LoanEventModal
