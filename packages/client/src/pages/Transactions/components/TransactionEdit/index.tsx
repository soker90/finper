import { ChangeEvent, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormHelperText,
  Grid
} from '@mui/material'
import { mutate } from 'swr'

import { InputForm, SelectForm, SelectGroupForm } from 'components'
import { addTransaction, editTransaction, deleteTransaction } from 'services/apiService'
import { TRANSACTIONS } from 'constants/api-paths'
import { Transaction } from 'types/transaction'
import { useGroupedCategories, useAccounts } from 'hooks'
import './style.module.css'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'

const TransactionEdit = ({
  transaction,
  hideForm,
  isNew
}: { transaction?: Transaction, hideForm: () => void, isNew?: boolean }) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      note: transaction?.note || '',
      account: transaction?.account?._id,
      category: transaction?.category?._id
    }
  })
  const { categories } = useGroupedCategories()
  const { accounts } = useAccounts()

  const onSubmit = handleSubmit(async (params) => {
    const { error } = transaction?._id ? await editTransaction(transaction._id, params as any) : await addTransaction(params as any)
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
    mutate(TRANSACTIONS)
    hideForm()
  }

  return (
        <form onSubmit={onSubmit}>
            <Grid container spacing={3}>
                <SelectForm id='account' label='Cuenta'
                            options={accounts}
                            optionValue='_id'
                            optionLabel='name'
                            error={!!errors.account} {...register('account', { required: true })}
                            errorText='Introduce una cuenta válida' />

                <SelectForm id='type' label='Tipo'
                            options={TYPES_TRANSACTIONS_ENTRIES}
                            optionValue={0}
                            optionLabel={1}
                />

                <SelectGroupForm id='category' label='Categoria'
                                 options={categories}
                                 optionValue='_id'
                                 optionLabel='name'
                                 error={!!errors.category} {...register('category', { required: true })}
                                 errorText='Introduce una categoria válida' />

                <InputForm id='note' label='Nota' placeholder='Nota'
                           error={!!errors.note} {...register('note', { required: true, minLength: 3 })}
                           errorText='Introduce una nota válida' />

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
