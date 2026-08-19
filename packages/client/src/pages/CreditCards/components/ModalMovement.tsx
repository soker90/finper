import { useEffect } from 'react'
import { useForm, Controller, type Control } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import DateForm from 'components/forms/DateForm'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import SelectGroupForm from 'components/forms/SelectGroupForm'
import AutocompleteForm from 'components/forms/AutocompleteForm'
import TagsInput from 'components/forms/TagsInput'
import { useGroupedCategories, useStores, useAvailableTags } from 'hooks'
import { addCreditCardMovement, editCreditCardMovement } from 'services/apiService'
import { getId } from 'utils'
import { useSubmitError } from '../hooks/useSubmitError'
import type { CreditCardMovement } from 'types'

const MOVEMENT_TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto (Aumenta deuda)' },
  { value: 'income', label: 'Devolución / Abono (Reduce deuda)' }
]

interface MovementFormValues {
  date: number | null
  amount: string
  type: 'expense' | 'income'
  categoryId: string
  storeId: string
  note: string
  tags: string[]
}

interface ModalMovementProps {
  open: boolean
  onClose: () => void
  creditCardId: string
  movement?: CreditCardMovement | null
  onSuccess: () => void
}

const buildDefaultValues = (movement?: CreditCardMovement | null): MovementFormValues => movement
  ? {
      date: movement.date,
      amount: String(movement.amount),
      type: movement.type || 'expense',
      categoryId: movement.categoryId || '',
      storeId: movement.store?.name || '',
      note: movement.note || '',
      tags: movement.tags || []
    }
  : {
      date: Date.now(),
      amount: '',
      type: 'expense',
      categoryId: '',
      storeId: '',
      note: '',
      tags: []
    }

export const ModalMovement = ({ open, onClose, creditCardId, movement, onSuccess }: ModalMovementProps) => {
  const { categories } = useGroupedCategories()
  const { stores } = useStores()
  const { tags: availableTags } = useAvailableTags()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<MovementFormValues>({
    defaultValues: buildDefaultValues(movement)
  })

  useEffect(() => {
    if (open) reset(buildDefaultValues(movement))
  }, [reset, open, movement])

  const { error: submitError, runSubmit } = useSubmitError()

  const handleFormSubmit = handleSubmit((data) => runSubmit(async () => {
    const payload = {
      date: new Date(data.date!).getTime(),
      amount: parseFloat(data.amount),
      type: data.type,
      categoryId: data.categoryId,
      storeId: data.storeId || null,
      note: data.note.trim() || null,
      tags: data.tags
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
      <DateForm
        placeholder='Introduce una fecha'
        id='date'
        label='Fecha'
        size={4}
        error={Boolean(errors.date)}
        errorText='La fecha es obligatoria'
        control={control}
      />

      <SelectForm
        id='type'
        label='Tipo'
        size={4}
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
        size={4}
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
          <SelectGroupForm
            id='categoryId'
            label='Categoría'
            size={4}
            options={categories}
            optionValue='_id'
            optionLabel='name'
            voidOption
            error={Boolean(errors.categoryId)}
            errorText='Selecciona una categoría'
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            inputRef={field.ref}
          />
        )}
      />

      <AutocompleteForm
        options={stores}
        optionLabel='name' id='storeId' label='Tienda'
        placeholder='Tienda'
        size={4}
        error={false}
        errorText=''
        {...register('storeId')}
        {...(movement?.store && { defaultValue: movement.store })}
      />

      <TagsInput
        name='tags'
        control={control as unknown as Control<any>}
        availableTags={availableTags}
        label='Etiquetas'
        size={4}
      />

      <InputForm
        id='note'
        label='Nota / Concepto (opcional)'
        placeholder='Ej. Compra supermercado'
        size={12}
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
