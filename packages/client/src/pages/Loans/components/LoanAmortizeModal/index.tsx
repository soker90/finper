import { Controller, useForm } from 'react-hook-form'
import { Checkbox, FormControlLabel } from '@mui/material'
import dayjs from 'dayjs'

import { DateForm, InputForm, ModalGrid, SelectForm } from 'components'
import { payLoanExtraordinary } from 'services/apiService'
import { Loan } from 'types'

import { useApiError, useLoanMutate } from '../../hooks'
import { inputToTimestamp } from '../../utils/date'

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
  const { setApiError, ApiErrorMessage } = useApiError()
  const { revalidate } = useLoanMutate(loan._id)
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { date: dayjs().format('YYYY-MM-DD'), amount: undefined, mode: 'reduceTerm', addMovement: true }
  })

  const onSubmit = handleSubmit(async (params) => {
    const { error } = await payLoanExtraordinary(loan._id, {
      date: params.date ? inputToTimestamp(params.date) : undefined,
      amount: Number(params.amount),
      mode: params.mode,
      addMovement: params.addMovement
    })
    if (error) { setApiError(error); return }
    await revalidate()
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
      {ApiErrorMessage}
    </ModalGrid>
  )
}

export default LoanAmortizeModal
