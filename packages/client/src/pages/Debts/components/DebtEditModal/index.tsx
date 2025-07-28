import { useForm } from 'react-hook-form'
import { mutate } from 'swr'

import { DateForm, InputForm, ModalGrid, SelectForm } from 'components'
import { DEBTS } from 'constants/api-paths'
import { addDebt, editDebt } from 'services/apiService'
import { Debt, DebtType } from 'types'

import { TYPES_DEBTS } from '../../constants'
import './style.module.css'

const DebtEditModal = ({
  debt,
  onClose

}: { debt?: Debt, onClose: () => void }) => {
  const { register, handleSubmit, formState: { errors }, control, setError } = useForm({
    defaultValues: {
      from: debt?.from || '',
      date: debt?.date || null,
      amount: debt?.amount,
      concept: debt?.concept || '',
      type: debt?.type || DebtType.FROM
    }

  })

  const onSubmit = handleSubmit(async (params) => {
    if (!params.date) {
      setError('date', { type: 'required' })
      return
    }

    const formattedParams = {
      from: params.from,
      date: new Date(params.date).getTime(),
      amount: params.amount,
      type: params.type,
      concept: params.concept
    }
    const {
      error
    } = debt?._id ? await editDebt(debt._id, formattedParams as any) : await addDebt(formattedParams as any)
    if (!error) {
      await mutate(DEBTS)
      onClose()
    }
  })

  return (
    <ModalGrid show onClose={onClose} title='Nuevo Movimiento' action={onSubmit}>

      <SelectForm
        id='type' label='Tipo'
        options={TYPES_DEBTS}
        optionValue='value'
        optionLabel='title'
        size={4}
        error={!!errors.type} {...register('type', { required: true })}
      />

      <InputForm
        id='from' label='De/A' placeholder='Introduce la persona'
        error={!!errors.from} {...register('from', { required: true, minLength: 3 })}
        errorText='Introduce una persona'
      />

      <DateForm
        placeholder='Introduce una fecha' id='date' label='Fecha'
        error={!!errors.date}
        control={control}
      />

      <InputForm
        id='amount' label='Cantidad' placeholder='Introduce la cantidad'
        error={!!errors.amount} {...register('amount', { required: true, valueAsNumber: true })}
        errorText='Introduce una cantidad válida'
        type='number' inputProps={{ step: 'any' }}
        size={4}
      />

      <InputForm
        id='concept' label='Concepto' placeholder='Introduce el concepto'
        error={!!errors.concept} {...register('concept', { required: true, minLength: 6 })}
        errorText='Introduce un concept válido'
      />

    </ModalGrid>
  )
}

export default DebtEditModal
