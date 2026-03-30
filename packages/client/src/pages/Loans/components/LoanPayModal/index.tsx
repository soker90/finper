import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { mutate } from 'swr'
import dayjs from 'dayjs'
import { Checkbox, FormControlLabel, FormHelperText, Grid } from '@mui/material'

import { DateForm, InputForm, ModalGrid } from 'components'
import { LOANS, LOAN_DETAIL } from 'constants/api-paths'
import { payLoanOrdinary } from 'services/apiService'
import { AmortizationRow, Loan } from 'types'

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
  const [apiError, setApiError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<FormValues>({
    defaultValues: {
      date: dayjs(row.date).format('YYYY-MM-DD'),
      amount: String(row.amount),
      addMovement: true
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    const date = params.date ? dayjs(params.date).startOf('day').valueOf() : row.date
    const amount = Number(params.amount)

    const { error } = await payLoanOrdinary(loan._id, { date, amount, addMovement: params.addMovement })
    if (error) { setApiError(error); return }

    await mutate(LOAN_DETAIL(loan._id))
    await mutate(LOANS)
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
      {apiError && (
        <Grid size={12}>
          <FormHelperText error>{apiError}</FormHelperText>
        </Grid>
      )}
    </ModalGrid>
  )
}

export default LoanPayModal
