import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { mutate } from 'swr'
import dayjs from 'dayjs'
import { FormHelperText, Grid } from '@mui/material'

import { DateForm, InputForm, ModalGrid, SelectForm } from 'components'
import { LOANS, LOAN_DETAIL } from 'constants/api-paths'
import { editLoanPayment } from 'services/apiService'
import { AmortizationRow, LoanPaymentType } from 'types'

const PAYMENT_TYPE_OPTIONS = [
  { value: LoanPaymentType.ORDINARY, label: 'Ordinaria' },
  { value: LoanPaymentType.EXTRAORDINARY, label: 'Extraordinaria' }
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
  const [apiError, setApiError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<FormValues>({
    defaultValues: {
      date: dayjs(payment.date).format('YYYY-MM-DD'),
      amount: String(payment.amount),
      interest: String(payment.interest),
      principal: String(payment.principal),
      type: payment.type
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await editLoanPayment(loanId, payment._id!, {
      date: params.date ? dayjs(params.date).startOf('day').valueOf() : payment.date,
      amount: Number(params.amount),
      interest: Number(params.interest),
      principal: Number(params.principal),
      type: params.type
    })
    if (error) { setApiError(error); return }
    await mutate(LOAN_DETAIL(loanId))
    await mutate(LOANS)
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
      {apiError && (
        <Grid size={12}>
          <FormHelperText error>{apiError}</FormHelperText>
        </Grid>
      )}
    </ModalGrid>
  )
}

export default LoanEditPaymentModal
