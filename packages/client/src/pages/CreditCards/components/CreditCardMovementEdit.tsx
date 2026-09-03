import { useState } from 'react'
import { useForm, useFieldArray, Controller, type Control } from 'react-hook-form'
import { Button, FormHelperText, Grid, IconButton, Stack, Typography } from '@mui/material'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'

import { ConfirmModal } from 'components'
import DateForm from 'components/forms/DateForm'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import SelectGroupForm from 'components/forms/SelectGroupForm'
import AutocompleteForm from 'components/forms/AutocompleteForm'
import TagsInput from 'components/forms/TagsInput'
import { useGroupedCategories, useStores, useAvailableTags } from 'hooks'
import { editCreditCardMovement, deleteCreditCardMovement } from 'services/apiService'
import { getId } from 'utils'
import { useCreditCardMutate } from '../hooks/useCreditCards'
import { useSubmitError } from '../hooks/useSubmitError'
import type { CreditCardMovement } from 'types'

const MOVEMENT_TYPE_OPTIONS = [
  { value: 'expense', label: 'Gasto (Aumenta deuda)' },
  { value: 'income', label: 'Devolución / Abono (Reduce deuda)' }
]

const roundMoney = (value: number): number =>
  Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100

type SplitFormValue = { categoryId: string, amount: number | '', tags: string[] }

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

export const CreditCardMovementEdit = ({ movement, hideForm }: CreditCardMovementEditProps) => {
  const { categories } = useGroupedCategories()
  const { stores } = useStores()
  const { tags: availableTags } = useAvailableTags()
  const triggerMutate = useCreditCardMutate(movement.creditCardId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const existingSplits = movement.splits && movement.splits.length >= 2
    ? movement.splits.map(split => ({
      categoryId: split.categoryId,
      amount: split.amount as number | '',
      tags: split.tags || []
    }))
    : []
  const [splitMode, setSplitMode] = useState(existingSplits.length >= 2)
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
  const { fields, append, remove } = useFieldArray({ control, name: 'splits' })
  const watchedAmount = Number(watch('amount') || 0)
  const watchedSplits = watch('splits')
  const remaining = roundMoney(watchedAmount - roundMoney((watchedSplits || []).reduce((sum, split) => sum + (Number(split.amount) || 0), 0)))
  const watchedCategoryId = watch('categoryId')
  const watchedTags = watch('tags')

  const enableSplitMode = () => {
    setSplitMode(true)
    if (fields.length === 0) {
      append({ categoryId: watchedCategoryId || '', amount: watchedAmount || '', tags: watchedTags || [] })
      append({ categoryId: '', amount: '', tags: [] })
      setValue('tags', [])
    }
  }

  const disableSplitMode = () => {
    setSplitMode(false)
    const firstLineTags = watchedSplits?.[0]?.tags
    if (firstLineTags?.length) setValue('tags', firstLineTags)
    setValue('splits', [])
  }

  const assignRemaining = () => {
    if (fields.length === 0) return
    const lastIndex = fields.length - 1
    const others = roundMoney((watchedSplits || [])
      .filter((_, index) => index !== lastIndex)
      .reduce((sum, split) => sum + (Number(split.amount) || 0), 0))
    setValue(`splits.${lastIndex}.amount`, roundMoney(watchedAmount - others))
  }

  const { error: submitError, runSubmit } = useSubmitError()

  const onSubmit = handleSubmit((data) => runSubmit(async () => {
    const id = getId(movement)
    if (!id) return { error: 'No se pudo identificar el movimiento a editar' }
    const hasSplits = splitMode && data.splits.length >= 2
    if (hasSplits && remaining !== 0) {
      return { error: 'La suma de los desgloses debe coincidir con el importe total' }
    }
    return editCreditCardMovement(movement.creditCardId, id, {
      date: data.date ? new Date(data.date).getTime() : movement.date,
      amount: parseFloat(data.amount),
      type: data.type,
      categoryId: hasSplits ? data.splits[0].categoryId : data.categoryId,
      storeId: data.storeId || null,
      note: data.note.trim() || null,
      tags: hasSplits ? [] : data.tags,
      ...(hasSplits && {
        splits: data.splits.map(split => ({
          categoryId: split.categoryId,
          amount: Number(split.amount),
          ...(split.tags?.length && { tags: split.tags })
        }))
      })
    })
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
            {!splitMode
              ? (
                <Button variant='outlined' startIcon={<PlusOutlined />} onClick={enableSplitMode}>
                  Dividir movimiento
                </Button>
                )
              : (
                <Stack spacing={2}>
                  <Stack direction='row' spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant='subtitle2'>Desglose</Typography>
                    <Button variant='text' color='inherit' onClick={disableSplitMode}>Quitar división</Button>
                  </Stack>
                  {fields.map((field, index) => (
                    <Grid container spacing={2} key={field.id} sx={{ alignItems: 'center' }}>
                      <SelectGroupForm
                        id={`splits.${index}.categoryId`} label='Categoria'
                        options={categories}
                        optionValue='_id'
                        optionLabel='name'
                        error={!!errors.splits?.[index]?.categoryId}
                        {...register(`splits.${index}.categoryId`, { required: true })}
                        errorText='Introduce una categoria válida'
                        size={4}
                      />
                      <InputForm
                        id={`splits.${index}.amount`} label='Importe' placeholder='0'
                        error={!!errors.splits?.[index]?.amount}
                        {...register(`splits.${index}.amount`, { required: true, valueAsNumber: true })}
                        errorText='Introduce un importe'
                        type='number' inputProps={{ step: 'any' }}
                        size={3}
                      />
                      <TagsInput
                        name={`splits.${index}.tags`}
                        control={control as unknown as Control<any>}
                        availableTags={availableTags}
                        label='Etiquetas'
                        size={4}
                      />
                      <Grid size={{ xs: 12, md: 1 }}>
                        <IconButton
                          aria-label='Eliminar línea'
                          color='error'
                          disabled={fields.length <= 2}
                          onClick={() => remove(index)}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
                    <Button
                      variant='outlined'
                      startIcon={<PlusOutlined />}
                      onClick={() => append({ categoryId: '', amount: '', tags: [] })}
                    >
                      Añadir categoría
                    </Button>
                    <Button variant='text' onClick={assignRemaining}>Asignar resto</Button>
                    <Typography variant='body2' color={remaining === 0 ? 'success.main' : 'error.main'}>
                      Restante: {remaining.toFixed(2)} €
                    </Typography>
                  </Stack>
                </Stack>
                )}
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
              disabled={isSubmitting || (splitMode && remaining !== 0)}
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
