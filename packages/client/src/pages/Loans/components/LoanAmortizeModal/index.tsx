import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { mutate } from 'swr'
import { Checkbox, FormControlLabel, FormHelperText, Grid } from '@mui/material'
import dayjs from 'dayjs'

import { DateForm, InputForm, ModalGrid, SelectForm } from 'components'
import { LOANS, LOAN_DETAIL } from 'constants/api-paths'
import { payLoanExtraordinary } from 'services/apiService'
import { Loan } from 'types'

interface Props {
  loan: Loan
  onClose: () => void
}

interface FormValues {
  date: string | null
  amount: number
  mode: 'reduceQuota' | 'reduceTerm'
  addMovement: boolean
}

const MODE_OPTIONS = [
  { value: 'reduceTerm', label: 'Reducir plazo' },
  { value: 'reduceQuota', label: 'Reducir cuota' }
]

const LoanAmortizeModal = ({ loan, onClose }: Props) => {
  const [apiError, setApiError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { date: dayjs().format('YYYY-MM-DD'), amount: undefined, mode: 'reduceTerm', addMovement: true }
  })

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await payLoanExtraordinary(loan._id, {
      date: params.date ? dayjs(params.date).startOf('day').valueOf() : undefined,
      amount: Number(params.amount),
      mode: params.mode,
      addMovement: params.addMovement
    })
    if (error) { setApiError(error); return }
    await mutate(LOAN_DETAIL(loan._id))
    await mutate(LOANS)
    onClose()
  })

  return (
    <ModalGrid show onClose={onClose} title='Amortización extraordinaria' action={onSubmit} actionDisabled={isSubmitting}>
      <DateForm
        id='date'
        label='Fecha de la amortización'
        placeholder='Fecha de la amortización'
        error={!!errors.date}
        control={control}
        size={4}
      />
      <InputForm
        id='amount'
        label='Importe a amortizar'
        type='number'
        inputProps={{ step: 'any', min: 0 }}
        error={!!errors.amount}
        errorText='Importe requerido'
        size={4}
        {...register('amount', { required: true, valueAsNumber: true })}
      />
      <SelectForm
        id='mode'
        label='Destino del ahorro'
        options={MODE_OPTIONS}
        optionValue='value'
        optionLabel='label'
        size={4}
        {...register('mode', { required: true })}
      />
      <Controller
        name='addMovement'
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            }
            label='Añadir movimiento en la cuenta'
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

export default LoanAmortizeModal
