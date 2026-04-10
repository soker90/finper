import { useForm } from 'react-hook-form'

import { DateForm, InputForm, ModalGrid, SelectForm } from 'components'
import { editLoanPayment } from 'services/apiService'
import { AmortizationRow, LoanPaymentType, LOAN_PAYMENT } from 'types'

import { useApiError, useLoanMutate } from '../../hooks'
import { dateToInput, inputToTimestamp } from '../../utils/date'

const PAYMENT_TYPE_OPTIONS = [
  { value: LOAN_PAYMENT.ORDINARY, label: 'Ordinaria' },
  { value: LOAN_PAYMENT.EXTRAORDINARY, label: 'Extraordinaria' }
]

interface FormValues {
  date: string | null
  amount: string
  interest: string
  principal: string
  type: LoanPaymentType
}

interface Props {
  loanId: string
  payment: AmortizationRow
  onClose: () => void
}

const LoanEditPaymentModal = ({ loanId, payment, onClose }: Props) => {
  const { setApiError, ApiErrorMessage } = useApiError()
  const { revalidate } = useLoanMutate(loanId)
  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<FormValues>({
    defaultValues: {
      date: dateToInput(payment.date),
      amount: String(payment.amount),
      interest: String(payment.interest),
      principal: String(payment.principal),
      type: payment.type
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await editLoanPayment(loanId, payment._id!, {
      date: params.date ? inputToTimestamp(params.date) : payment.date,
      amount: Number(params.amount),
      interest: Number(params.interest),
      principal: Number(params.principal),
      type: params.type
    })
    if (error) { setApiError(error); return }
    await revalidate()
    onClose()
  })

  return (
    <ModalGrid show onClose={onClose} title='Editar cuota' action={onSubmit} actionDisabled={isSubmitting}>
      <DateForm
        id='date'
        label='Fecha de pago'
        placeholder='Fecha de pago'
        error={!!errors.date}
        control={control}
        size={4}
      />
      <InputForm
        id='amount'
        label='Cuota total'
        type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.amount}
        errorText='Importe requerido'
        size={4}
        {...register('amount', { required: true })}
      />
      <InputForm
        id='interest'
        label='Intereses'
        type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.interest}
        errorText='Intereses requeridos'
        size={4}
        {...register('interest', { required: true })}
      />
      <InputForm
        id='principal'
        label='Capital amortizado'
        type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.principal}
        errorText='Capital requerido'
        size={4}
        {...register('principal', { required: true })}
      />
      <SelectForm
        id='type'
        label='Tipo'
        options={PAYMENT_TYPE_OPTIONS}
        optionValue='value'
        optionLabel='label'
        size={4}
        error={!!errors.type}
        {...register('type', { required: true })}
      />
      {ApiErrorMessage}
    </ModalGrid>
  )
}

export default LoanEditPaymentModal
