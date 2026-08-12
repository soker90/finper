import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import { useCategories } from 'hooks/useCategories'
import { useStores } from 'hooks/useStores'
import { addCreditCardMovement, editCreditCardMovement } from 'services/apiService'
import { getId } from 'utils'
import { useSubmitError } from '../hooks/useSubmitError'
import type { CreditCardMovement } from 'types'

const MOVEMENT_TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto (Aumenta deuda)' },
  { value: 'income', label: 'Devolución / Abono (Reduce deuda)' }
]

interface MovementFormValues {
  date: string
  amount: string
  type: 'expense' | 'income'
  categoryId: string
  storeId: string
  note: string
}

interface ModalMovementProps {
  open: boolean
  onClose: () => void
  creditCardId: string
  movement?: CreditCardMovement | null
  onSuccess: () => void
}

const toDateInputValue = (date: number | string) => new Date(date).toISOString().split('T')[0]

const buildDefaultValues = (movement?: CreditCardMovement | null): MovementFormValues => movement
  ? {
      date: toDateInputValue(movement.date),
      amount: String(movement.amount),
      type: movement.type || 'expense',
      categoryId: movement.categoryId || '',
      storeId: movement.storeId || '',
      note: movement.note || ''
    }
  : {
      date: '',
      amount: '',
      type: 'expense',
      categoryId: '',
      storeId: '',
      note: ''
    }

export const ModalMovement = ({ open, onClose, creditCardId, movement, onSuccess }: ModalMovementProps) => {
  const { categories } = useCategories()
  const { stores } = useStores()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<MovementFormValues>({
    defaultValues: buildDefaultValues(movement)
  })

  useEffect(() => {
    if (open) reset(buildDefaultValues(movement))
  }, [reset, open, movement])

  const { error: submitError, runSubmit } = useSubmitError()

  const handleFormSubmit = handleSubmit((data) => runSubmit(async () => {
    const payload = {
      date: new Date(data.date).getTime(),
      amount: parseFloat(data.amount),
      type: data.type,
      categoryId: data.categoryId,
      storeId: data.storeId || null,
      note: data.note.trim() || null
    }
    if (movement) {
      const id = getId(movement)
      if (!id) return { error: 'No se pudo identificar el movimiento a editar' }
      return editCreditCardMovement(creditCardId, id, payload)
    }
    return addCreditCardMovement(creditCardId, payload)
  }, () => {
    onSuccess()
    onClose()
  }))

  if (!open) return null

  return (
    <ModalGrid
      show={open}
      title={movement ? 'Editar movimiento de tarjeta' : 'Nuevo movimiento con tarjeta'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <InputForm
        id='date'
        label='Fecha'
        type='date'
        size={6}
        error={Boolean(errors.date)}
        errorText='La fecha es obligatoria'
        {...register('date', { required: true })}
      />

      <SelectForm
        id='type'
        label='Tipo'
        size={6}
        options={MOVEMENT_TYPE_OPTIONS}
        optionValue='value'
        optionLabel='label'
        error={Boolean(errors.type)}
        errorText='El tipo es obligatorio'
        {...register('type', { required: true })}
      />

      <InputForm
        id='amount'
        label='Importe (€)'
        placeholder='Ej. 49.99'
        type='number'
        size={6}
        error={Boolean(errors.amount)}
        errorText='El importe debe ser mayor a 0'
        inputProps={{ step: '0.01', min: '0.01' }}
        {...register('amount', { required: true, min: 0.01 })}
      />

      <Controller
        name='categoryId'
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <SelectForm
            id='categoryId'
            label='Categoría'
            size={6}
            options={categories}
            optionValue='_id'
            optionLabel='name'
            voidOption
            error={Boolean(errors.categoryId)}
            errorText='Selecciona una categoría'
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            inputRef={field.ref}
          />
        )}
      />

      <Controller
        name='storeId'
        control={control}
        render={({ field }) => (
          <SelectForm
            id='storeId'
            label='Comercio / Tienda (opcional)'
            size={6}
            options={stores}
            optionValue='_id'
            optionLabel='name'
            voidOption
            voidLabel='-- Ninguno --'
            error={false}
            errorText=''
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            inputRef={field.ref}
          />
        )}
      />

      <InputForm
        id='note'
        label='Nota / Concepto (opcional)'
        placeholder='Ej. Compra supermercado'
        size={6}
        error={false}
        errorText=''
        {...register('note')}
      />

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}
