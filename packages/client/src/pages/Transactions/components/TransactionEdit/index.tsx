import { useForm, type Control } from 'react-hook-form'
import { Button, FormHelperText, Grid } from '@mui/material'
import { mutate } from 'swr'

import { DateForm, InputForm, SelectForm, SelectGroupForm, SplitModeSection } from 'components'
import { addTransaction, deleteTransaction, editTransaction } from 'services/apiService'
import { BUDGETS, DASHBOARD_STATS, TRANSACTIONS } from 'constants/api-paths'
import { Transaction } from 'types'
import { useAccounts, useGroupedCategories, useStores, useAvailableTags, useSplitLines, useSubmitError, mapExistingSplits, type SplitFormValue } from 'hooks'
import './style.module.css'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'
import AutocompleteForm from 'components/forms/AutocompleteForm'
import TagsInput from 'components/forms/TagsInput'

const revalidateRelated = () =>
  mutate((key) => typeof key === 'string' && (
    key.startsWith(TRANSACTIONS) || key.startsWith(BUDGETS) || key === DASHBOARD_STATS
  ))

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

/** Builds the API payload for creating/editing a transaction, resolving the
 * split-mode fields (category/tags/splits) into their final shape. */
const buildTransactionPayload = (params: FormValues, hasSplits: boolean) => ({
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
})

const TransactionEdit = ({
  transaction,
  hideForm,
  isNew
}: { transaction?: Transaction, hideForm: () => void, isNew?: boolean, query: string }) => {
  const existingSplits = mapExistingSplits(transaction?.splits, split => split.category._id)
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
  const { categories } = useGroupedCategories()
  const { accounts } = useAccounts()
  const { stores } = useStores()
  const { tags: availableTags } = useAvailableTags()
  const {
    splitMode, fields, append, remove, remaining, hasSplits, isAmountMismatch,
    enableSplitMode, disableSplitMode, assignRemaining
  } = useSplitLines({
    control: control as unknown as Control<any>,
    watch,
    setValue,
    categoryFieldName: 'category',
    initialSplitMode: existingSplits.length >= 2
  })
  const { error, runSubmit } = useSubmitError()

  const onSubmit = handleSubmit((params) => runSubmit(async () => {
    if (isAmountMismatch) {
      return { error: 'La suma de los desgloses debe coincidir con el importe total' }
    }
    const formattedParams = buildTransactionPayload(params, hasSplits)
    return transaction?._id
      ? await editTransaction(transaction._id, formattedParams as any)
      : await addTransaction(formattedParams as any)
  }, async () => {
    await revalidateRelated()
    hideForm()
  }))

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
            categorySize={3}
            amountSize={3}
            tagsSize={5}
          />
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
            disabled={isAmountMismatch}
          >
            Guardar
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default TransactionEdit
