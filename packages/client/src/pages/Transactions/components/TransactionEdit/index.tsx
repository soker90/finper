import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, FormHelperText, Grid } from '@mui/material'
import { mutate } from 'swr'

import { DateForm, InputForm, SelectForm, SelectGroupForm } from 'components'
import { addTransaction, deleteTransaction, editTransaction } from 'services/apiService'
import { TRANSACTIONS } from 'constants/api-paths'
import { Transaction, TransactionType } from 'types/transaction'
import { useAccounts, useGroupedCategories, useStores } from 'hooks'
import './style.module.css'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'
import AutocompleteForm from 'components/forms/AutocompleteForm'

const TransactionEdit = ({
  transaction,
  hideForm,
  isNew
}: { transaction?: Transaction, hideForm: () => void, isNew?: boolean }) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors }, control } = useForm({
    defaultValues: {
      note: transaction?.note || '',
      account: transaction?.account?._id,
      category: transaction?.category?._id,
      date: transaction?.date || null,
      amount: transaction?.amount,
      type: transaction?.type || TransactionType.Expense,
      store: transaction?.store?.name || ''
    }
  })
  const { categories } = useGroupedCategories()
  const { accounts } = useAccounts()
  const { stores } = useStores()

  const onSubmit = handleSubmit(async (params) => {
    const formattedParams = {
      date: params.date ? new Date(params.date).getTime() : null,
      account: params.account,
      category: params.category,
      amount: params.amount,
      type: params.type,
      ...(params.note && { note: params.note }),
      ...(params.store && { store: params.store })
    }
    const { error } = transaction?._id ? await editTransaction(transaction._id, formattedParams as any) : await addTransaction(formattedParams as any)
    if (!error) {
      mutate(TRANSACTIONS)
      hideForm()
    }
    setError(error)
  })

  const handleDeleteButton = async () => {
    if (!isNew && transaction?._id) {
      await deleteTransaction(transaction._id)
    }
    await mutate(TRANSACTIONS)
    hideForm()
  }

  return (
        <form onSubmit={onSubmit}>
            <Grid container spacing={3}>
                <DateForm placeholder={'Introduce una fecha'} id='date' label='Fecha'
                          error={!!errors.date}
                          control={control}
                />

                <SelectForm id='account' label='Cuenta'
                            options={accounts}
                            optionValue='_id'
                            optionLabel='name'
                            error={!!errors.account} {...register('account', { required: true })}
                            errorText='Introduce una cuenta válida'
                            size={2}/>

                <SelectForm id='type' label='Tipo'
                            options={TYPES_TRANSACTIONS_ENTRIES}
                            optionValue={0}
                            optionLabel={1}
                            size={2}
                            error={!!errors.type} {...register('type', { required: true })}
                />

                <SelectGroupForm id='category' label='Categoria'
                                 options={categories}
                                 optionValue='_id'
                                 optionLabel='name'
                                 error={!!errors.category} {...register('category', { required: true })}
                                 errorText='Introduce una categoria válida'
                                 size={2}/>

                <InputForm id='amount' label='Cantidad' placeholder='Introduce la cantidad'
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
                    defaultValue={transaction?.store}
                    {...register('store')}
                />

                <InputForm id='note' label='Nota' placeholder='Nota'
                           error={!!errors.note} {...register('note')}
                           errorText='Introduce una nota válida'
                           size={12}/>

                {error && (
                    <Grid item xs={12}>
                        <FormHelperText error>{error}</FormHelperText>
                    </Grid>
                )}

                <Grid item xs={12} md={6}>
                    <Button
                        disableElevation
                        fullWidth
                        size="large"
                        variant="contained"
                        color="error"
                        onClick={handleDeleteButton}
                        hidden={!transaction?._id}
                    >
                        {isNew ? 'Cancelar' : 'Eliminar'}
                    </Button>

                </Grid>
                <Grid item xs={12} md={6}>
                    <Button
                        disableElevation
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        Guardar
                    </Button>
                </Grid>
            </Grid>
        </form>
  )
}

export default TransactionEdit
