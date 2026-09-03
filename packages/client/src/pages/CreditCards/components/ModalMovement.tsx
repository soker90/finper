import { useEffect, useState } from 'react'
import { useForm, useFieldArray, Controller, type Control } from 'react-hook-form'
import { Alert, Box, Button, Grid, IconButton, Stack, Typography } from '@mui/material'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
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

interface ModalMovementProps {
  open: boolean
  onClose: () => void
  creditCardId: string
  movement?: CreditCardMovement | null
  onSuccess: () => void
}

const existingSplitsOf = (movement?: CreditCardMovement | null): SplitFormValue[] =>
  movement?.splits && movement.splits.length >= 2
    ? movement.splits.map(split => ({
      categoryId: split.categoryId,
      amount: split.amount,
      tags: split.tags || []
    }))
    : []

const buildDefaultValues = (movement?: CreditCardMovement | null): MovementFormValues => movement
  ? {
      date: movement.date,
      amount: String(movement.amount),
      type: movement.type || 'expense',
      categoryId: movement.categoryId || '',
      storeId: movement.store?.name || '',
      note: movement.note || '',
      tags: movement.tags || [],
      splits: existingSplitsOf(movement)
    }
  : {
      date: Date.now(),
      amount: '',
      type: 'expense',
      categoryId: '',
      storeId: '',
      note: '',
      tags: [],
      splits: []
    }

export const ModalMovement = ({ open, onClose, creditCardId, movement, onSuccess }: ModalMovementProps) => {
  const { categories } = useGroupedCategories()
  const { stores } = useStores()
  const { tags: availableTags } = useAvailableTags()

  const existingSplits = existingSplitsOf(movement)
  const [splitMode, setSplitMode] = useState(existingSplits.length >= 2)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, watch, setValue } = useForm<MovementFormValues>({
    defaultValues: buildDefaultValues(movement)
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'splits' })

  useEffect(() => {
    if (open) {
      const defaults = buildDefaultValues(movement)
      reset(defaults)
      setSplitMode(defaults.splits.length >= 2)
    }
  }, [reset, open, movement])

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

  const handleFormSubmit = handleSubmit((data) => runSubmit(async () => {
    const hasSplits = splitMode && data.splits.length >= 2
    if (hasSplits && remaining !== 0) {
      return { error: 'La suma de los desgloses debe coincidir con el importe total' }
    }
    const payload = {
      date: new Date(data.date!).getTime(),
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
      actionDisabled={isSubmitting || (splitMode && remaining !== 0)}
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

      {!splitMode && (
        <Controller
          name='categoryId'
          control={control}
          rules={{ required: !splitMode }}
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
      )}

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

      {!splitMode && (
        <TagsInput
          name='tags'
          control={control as unknown as Control<any>}
          availableTags={availableTags}
          label='Etiquetas'
          size={4}
        />
      )}

      <InputForm
        id='note'
        label='Nota / Concepto (opcional)'
        placeholder='Ej. Compra supermercado'
        size={12}
        error={false}
        errorText=''
        {...register('note')}
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
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}
