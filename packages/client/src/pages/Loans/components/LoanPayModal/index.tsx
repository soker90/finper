import { Controller, useForm } from 'react-hook-form'
import { Checkbox, FormControlLabel } from '@mui/material'

import { DateForm, InputForm, ModalGrid } from 'components'
import { payLoanOrdinary } from 'services/apiService'
import { AmortizationRow, Loan } from 'types'

import { useApiError, useLoanMutate } from '../../hooks'
import { dateToInput, inputToTimestamp } from '../../utils/date'

interface FormValues {
  date: string | null
  amount: string
  addMovement: boolean
}

interface Props {
  loan: Loan
  row: AmortizationRow
  onClose: () => void
}

const LoanPayModal = ({ loan, row, onClose }: Props) => {
  const { setApiError, ApiErrorMessage } = useApiError()
  const { revalidate } = useLoanMutate(loan._id)
  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<FormValues>({
    defaultValues: {
      date: dateToInput(row.date),
      amount: String(row.amount),
      addMovement: true
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    const date = params.date ? inputToTimestamp(params.date) : row.date
    const amount = Number(params.amount)

    const { error } = await payLoanOrdinary(loan._id, { date, amount, addMovement: params.addMovement })
    if (error) { setApiError(error); return }

    await revalidate()
    onClose()
  })

  return (
    <ModalGrid show onClose={onClose} title='Pagar cuota ordinaria' action={onSubmit} actionDisabled={isSubmitting}>
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
        label='Importe'
        type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.amount}
        errorText='Importe requerido'
        size={4}
        {...register('amount', { required: true })}
      />
      <Controller
        name='addMovement'
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                checked={field.value}
                onChange={e => field.onChange(e.target.checked)}
              />
            }
            label='Generar movimiento en la cuenta'
          />
        )}
      />
      {ApiErrorMessage}
    </ModalGrid>
  )
}

export default LoanPayModal
