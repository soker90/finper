import { useForm } from 'react-hook-form'
import { mutate } from 'swr'

import { DateForm, InputForm, ModalGrid } from 'components'
import { LOANS, LOAN_DETAIL } from 'constants/api-paths'
import { addLoanEvent } from 'services/apiService'
import { Loan } from 'types'

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
  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<FormValues>({
    defaultValues: { date: null, newRate: loan.interestRate, newPayment: loan.monthlyPayment }
  })

  const onSubmit = handleSubmit(async (params) => {
    await addLoanEvent(loan._id, {
      date: params.date ? new Date(params.date).getTime() : Date.now(),
      newRate: Number(params.newRate),
      newPayment: Number(params.newPayment)
    })
    await mutate(LOAN_DETAIL(loan._id))
    await mutate(LOANS)
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
    </ModalGrid>
  )
}

export default LoanEventModal
