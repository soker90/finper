import { useState } from 'react'
import { useForm, Controller, type Control } from 'react-hook-form'
import { Button, FormHelperText, Grid } from '@mui/material'

import { ConfirmModal, SplitModeSection } from 'components'
import DateForm from 'components/forms/DateForm'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import SelectGroupForm from 'components/forms/SelectGroupForm'
import AutocompleteForm from 'components/forms/AutocompleteForm'
import TagsInput from 'components/forms/TagsInput'
import { useGroupedCategories, useStores, useAvailableTags, useSplitLines, useSubmitError, mapExistingSplits, type SplitFormValue } from 'hooks'
import { editCreditCardMovement, deleteCreditCardMovement } from 'services/apiService'
import { getId } from 'utils'
import { useCreditCardMutate } from '../hooks/useCreditCards'
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
  splits: SplitFormValue[]
}

interface CreditCardMovementEditProps {
  movement: CreditCardMovement
  hideForm: () => void
}

/** Builds the API payload for editing a movement, resolving the split-mode
 * fields (categoryId/tags/splits) into their final shape. */
const buildMovementPayload = (data: MovementFormValues, hasSplits: boolean, movement: CreditCardMovement) => ({
  date: data.date ? new Date(data.date).getTime() : movement.date,
  amount: parseFloat(data.amount),
  type: data.type,
  categoryId: hasSplits ? data.splits[0].category : data.categoryId,
  storeId: data.storeId || null,
  note: data.note.trim() || null,
  tags: hasSplits ? [] : data.tags,
  ...(hasSplits && {
    splits: data.splits.map(split => ({
      categoryId: split.category,
      amount: Number(split.amount),
      ...(split.tags?.length && { tags: split.tags })
    }))
  })
})

export const CreditCardMovementEdit = ({ movement, hideForm }: CreditCardMovementEditProps) => {
  const { categories } = useGroupedCategories()
  const { stores } = useStores()
  const { tags: availableTags } = useAvailableTags()
  const triggerMutate = useCreditCardMutate(movement.creditCardId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const existingSplits = mapExistingSplits(movement.splits, split => split.categoryId)
  const { register, handleSubmit, formState: { errors, isSubmitting }, control, watch, setValue } = useForm<MovementFormValues>({
    defaultValues: {
      date: movement.date,
      amount: String(movement.amount),
      type: movement.type,
      categoryId: movement.categoryId || '',
      storeId: movement.store?.name || '',
      note: movement.note || '',
      tags: movement.tags || [],
      splits: existingSplits
    }
  })
  const {
    splitMode, fields, append, remove, remaining, hasSplits, isAmountMismatch,
    enableSplitMode, disableSplitMode, assignRemaining
  } = useSplitLines({
    control: control as unknown as Control<any>,
    watch,
    setValue,
    categoryFieldName: 'categoryId',
    initialSplitMode: existingSplits.length >= 2
  })

  const { error: submitError, runSubmit } = useSubmitError()

  const onSubmit = handleSubmit((data) => runSubmit(async () => {
    const id = getId(movement)
    if (!id) return { error: 'No se pudo identificar el movimiento a editar' }
    if (isAmountMismatch) {
      return { error: 'La suma de los desgloses debe coincidir con el importe total' }
    }
    return editCreditCardMovement(movement.creditCardId, id, buildMovementPayload(data, hasSplits, movement))
  }, () => {
    triggerMutate()
    hideForm()
  }))

  const handleDeleteConfirm = async () => {
    const id = getId(movement)
    if (!id) return
    await deleteCreditCardMovement(movement.creditCardId, id)
    triggerMutate()
    hideForm()
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <Grid container spacing={3}>
          <DateForm
            placeholder='Introduce una fecha' id='date' label='Fecha'
            error={!!errors.date}
            control={control}
            size={2}
          />

          <SelectForm
            id='type' label='Tipo'
            options={MOVEMENT_TYPE_OPTIONS}
            optionValue='value'
            optionLabel='label'
            size={3}
            error={!!errors.type} {...register('type', { required: true })}
          />

          {!splitMode && (
            <Controller
              name='categoryId'
              control={control}
              rules={{ required: !splitMode }}
              render={({ field }) => (
                <SelectGroupForm
                  id='categoryId' label='Categoría'
                  options={categories}
                  optionValue='_id'
                  optionLabel='name'
                  voidOption
                  error={Boolean(errors.categoryId)}
                  errorText='Selecciona una categoría'
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  inputRef={field.ref}
                  size={3}
                />
              )}
            />
          )}

          <InputForm
            id='amount' label='Importe (€)' placeholder='Introduce el importe'
            error={!!errors.amount} {...register('amount', { required: true, min: 0.01 })}
            errorText='El importe debe ser mayor a 0'
            type='number' inputProps={{ step: '0.01', min: '0.01' }}
            size={2}
          />

          <AutocompleteForm
            options={stores}
            optionLabel='name' id='storeId' label='Tienda'
            placeholder='Tienda'
            error={false}
            errorText=''
            size={2}
            {...register('storeId')}
            {...(movement.store && { defaultValue: movement.store })}
          />

          {!splitMode && (
            <TagsInput
              name='tags'
              control={control as unknown as Control<any>}
              availableTags={availableTags}
              label='Etiquetas'
              size={2}
            />
          )}

          <InputForm
            id='note' label='Nota' placeholder='Nota'
            error={false} {...register('note')}
            errorText=''
            size={splitMode ? 12 : 10}
          />

          <Grid size={12}>
            <SplitModeSection
              splitMode={splitMode}
              fields={fields}
              categories={categories}
              availableTags={availableTags}
              control={control as unknown as Control<any>}
              register={register as any}
              errors={errors}
              remaining={remaining}
              onAdd={() => append({ category: '', amount: '', tags: [] })}
              onRemove={remove}
              onAssignRemaining={assignRemaining}
              onEnableSplitMode={enableSplitMode}
              onDisableSplitMode={disableSplitMode}
            />
          </Grid>

          {submitError && (
            <Grid size={12}>
              <FormHelperText error>{submitError}</FormHelperText>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 6 }}>
            <Button
              disableElevation
              fullWidth
              size='large'
              variant='contained'
              color='error'
              onClick={() => setConfirmingDelete(true)}
            >
              Eliminar
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Button
              disableElevation
              fullWidth
              size='large'
              type='submit'
              variant='contained'
              color='primary'
              disabled={isSubmitting || isAmountMismatch}
            >
              Guardar
            </Button>
          </Grid>
        </Grid>
      </form>

      {confirmingDelete && (
        <ConfirmModal
          title='¿Eliminar movimiento?'
          description='¿Seguro que quieres eliminar este movimiento de la tarjeta? Esta acción no se puede deshacer.'
          confirmLabel='Eliminar movimiento'
          onConfirm={handleDeleteConfirm}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </>
  )
}
