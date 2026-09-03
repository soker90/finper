import { useState } from 'react'
import { useForm, useFieldArray, type Control } from 'react-hook-form'
import { Button, FormHelperText, Grid, IconButton, Stack, Typography } from '@mui/material'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { mutate } from 'swr'

import { DateForm, InputForm, SelectForm, SelectGroupForm } from 'components'
import { addTransaction, deleteTransaction, editTransaction } from 'services/apiService'
import { BUDGETS, DASHBOARD_STATS, TRANSACTIONS } from 'constants/api-paths'
import { Transaction } from 'types'
import { useAccounts, useGroupedCategories, useStores, useAvailableTags } from 'hooks'
import './style.module.css'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'
import AutocompleteForm from 'components/forms/AutocompleteForm'
import TagsInput from 'components/forms/TagsInput'

const roundMoney = (value: number): number =>
  Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100

const revalidateRelated = () =>
  mutate((key) => typeof key === 'string' && (
    key.startsWith(TRANSACTIONS) || key.startsWith(BUDGETS) || key === DASHBOARD_STATS
  ))

type SplitFormValue = { category: string, amount: number | '', tags: string[] }

type FormValues = {
  note: string
  account: string | undefined
  category: string | undefined
  date: number | null
  amount: number | undefined
  type: string
  store: string
  tags: string[]
  splits: SplitFormValue[]
}

const TransactionEdit = ({
  transaction,
  hideForm,
  isNew
}: { transaction?: Transaction, hideForm: () => void, isNew?: boolean, query: string }) => {
  const existingSplits = transaction?.splits && transaction.splits.length >= 2
    ? transaction.splits.map(split => ({
      category: split.category._id,
      amount: split.amount as number | '',
      tags: split.tags || []
    }))
    : []
  const [splitMode, setSplitMode] = useState(existingSplits.length >= 2)
  const [error, setError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      note: transaction?.note || '',
      account: transaction?.account?._id,
      category: transaction?.category?._id,
      date: transaction?.date || null,
      amount: transaction?.amount,
      type: transaction?.type || 'expense',
      store: transaction?.store?.name || '',
      tags: transaction?.tags || [],
      splits: existingSplits
    }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'splits' })
  const { categories } = useGroupedCategories()
  const { accounts } = useAccounts()
  const { stores } = useStores()
  const { tags: availableTags } = useAvailableTags()
  const watchedAmount = Number(watch('amount') || 0)
  const watchedSplits = watch('splits')
  const assigned = roundMoney((watchedSplits || []).reduce((sum, split) => sum + (Number(split.amount) || 0), 0))
  const remaining = roundMoney(watchedAmount - assigned)

  const watchedCategory = watch('category')
  const watchedTags = watch('tags')
  const enableSplitMode = () => {
    setSplitMode(true)
    if (fields.length === 0) {
      append({ category: watchedCategory || '', amount: watchedAmount || '', tags: watchedTags || [] })
      append({ category: '', amount: '', tags: [] })
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

  const onSubmit = handleSubmit(async (params) => {
    const hasSplits = splitMode && params.splits.length >= 2
    if (hasSplits && remaining !== 0) {
      setError('La suma de los desgloses debe coincidir con el importe total')
      return
    }
    const formattedParams = {
      date: params.date ? new Date(params.date).getTime() : null,
      account: params.account as string,
      category: hasSplits ? params.splits[0].category : params.category,
      amount: params.amount as number,
      type: params.type as FormValues['type'],
      ...(params.note && { note: params.note }),
      ...(params.store && { store: params.store }),
      ...(hasSplits ? { tags: [] } : (params.tags?.length && { tags: params.tags })),
      ...(hasSplits && {
        splits: params.splits.map(split => ({
          category: split.category,
          amount: Number(split.amount),
          ...(split.tags?.length && { tags: split.tags })
        }))
      })
    }
    const { error: submitError } = transaction?._id
      ? await editTransaction(transaction._id, formattedParams as any)
      : await addTransaction(formattedParams as any)
    if (!submitError) {
      await revalidateRelated()
      hideForm()
    }
    setError(submitError)
  })

  const handleDeleteButton = async () => {
    if (!isNew && transaction?._id) {
      await deleteTransaction(transaction._id)
      await revalidateRelated()
    }
    hideForm()
  }

  return (
    <form onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <DateForm
          placeholder='Introduce una fecha' id='date' label='Fecha'
          error={!!errors.date}
          control={control}
          size={2}
        />

        <SelectForm
          id='account' label='Cuenta'
          options={accounts}
          optionValue='_id'
          optionLabel='name'
          error={!!errors.account} {...register('account', { required: true })}
          errorText='Introduce una cuenta válida'
          size={2}
        />

        <SelectForm
          id='type' label='Tipo'
          options={TYPES_TRANSACTIONS_ENTRIES}
          optionValue={0}
          optionLabel={1}
          size={2}
          error={!!errors.type} {...register('type', { required: true })}
        />

        {!splitMode && (
          <SelectGroupForm
            id='category' label='Categoria'
            options={categories}
            optionValue='_id'
            optionLabel='name'
            error={!!errors.category} {...register('category', { required: true })}
            errorText='Introduce una categoria válida'
            size={2}
          />
        )}

        <InputForm
          id='amount' label='Cantidad' placeholder='Introduce la cantidad'
          error={!!errors.amount} {...register('amount', { required: true, valueAsNumber: true })}
          errorText='Introduce una cantidad válida'
          type='number' inputProps={{ step: 'any' }}
          size={2}
        />

        <AutocompleteForm
          options={stores}
          optionLabel='name' id='store' label='Tienda'
          placeholder='Tienda'
          error={!!errors.store}
          errorText='Introduce una tienda válida'
          size={2}
          {...register('store')}
          {...(transaction?.store && { defaultValue: transaction?.store })}
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
          error={!!errors.note} {...register('note')}
          errorText='Introduce una nota válida'
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
                      id={`splits.${index}.category`} label='Categoria'
                      options={categories}
                      optionValue='_id'
                      optionLabel='name'
                      error={!!errors.splits?.[index]?.category}
                      {...register(`splits.${index}.category`, { required: true })}
                      errorText='Introduce una categoria válida'
                      size={3}
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
                      size={5}
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
                    onClick={() => append({ category: '', amount: '', tags: [] })}
                  >
                    Añadir categoría
                  </Button>
                  <Button variant='text' onClick={assignRemaining}>Asignar resto</Button>
                  <Typography
                    variant='body2'
                    color={remaining === 0 ? 'success.main' : 'error.main'}
                  >
                    Restante: {remaining.toFixed(2)} €
                  </Typography>
                </Stack>
              </Stack>
              )}
        </Grid>

        {error && (
          <Grid size={12}>
            <FormHelperText error>{error}</FormHelperText>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <Button
            disableElevation
            fullWidth
            size='large'
            variant='contained'
            color='error'
            onClick={handleDeleteButton}
            hidden={!transaction?._id}
          >
            {isNew ? 'Cancelar' : 'Eliminar'}
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
            disabled={splitMode && remaining !== 0}
          >
            Guardar
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default TransactionEdit
