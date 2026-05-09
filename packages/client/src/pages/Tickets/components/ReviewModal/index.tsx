import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, FormHelperText, Grid } from '@mui/material'
import { mutate } from 'swr'

import { ModalGrid, DateForm, InputForm, SelectForm, SelectGroupForm } from 'components'
import AutocompleteForm from 'components/forms/AutocompleteForm'
import { addTransaction } from 'services/apiService'
import { TRANSACTIONS } from 'constants/api-paths'
import { Ticket, TransactionType, TRANSACTION } from 'types'
import { useAccounts, useGroupedCategories, useTickets, useStores } from 'hooks'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'

interface Props {
  ticket: Ticket
  onClose: () => void
}

interface FormValues {
  date: number | null
  amount: number
  account: string
  category: string
  type: TransactionType
  store: string
}

const ReviewModal = ({ ticket, onClose }: Props) => {
  const { accounts } = useAccounts()
  const { categories } = useGroupedCategories()
  const { stores } = useStores()
  const { markReviewed } = useTickets()
  const [error, setError] = useState<string | undefined>(undefined)

  const { register, handleSubmit, formState: { errors }, control } = useForm<FormValues>({
    defaultValues: {
      date: ticket.date,
      amount: ticket.amount ?? 0,
      account: '',
      category: '',
      type: TRANSACTION.Expense,
      store: ticket.store ?? ''
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    setError(undefined)

    const transactionParams = {
      date: params.date ? new Date(params.date).getTime() : Date.now(),
      amount: params.amount,
      account: params.account,
      category: params.category,
      type: params.type,
      ...(params.store && { store: params.store })
    }

    const { error: txError } = await addTransaction(transactionParams as any)
    if (txError) {
      setError(txError)
      return
    }

    const { error: reviewError } = await markReviewed(ticket.id)
    if (reviewError) {
      setError(reviewError)
      return
    }

    await mutate(TRANSACTIONS)
    onClose()
  })

  return (
    <ModalGrid
      show
      title={`Revisar ticket: ${ticket.store ?? 'Sin comercio'}`}
      onClose={onClose}
      action={onSubmit}
    >
      <DateForm
        placeholder='Fecha del ticket' id='date' label='Fecha'
        error={!!errors.date}
        control={control}
        size={6}
      />

      <SelectForm
        id='account' label='Cuenta'
        options={accounts}
        optionValue='_id'
        optionLabel='name'
        error={!!errors.account} {...register('account', { required: true })}
        errorText='Selecciona una cuenta'
        size={6}
      />

      <SelectForm
        id='type' label='Tipo'
        options={TYPES_TRANSACTIONS_ENTRIES}
        optionValue={0}
        optionLabel={1}
        size={6}
        error={!!errors.type} {...register('type', { required: true })}
      />

      <SelectGroupForm
        id='category' label='Categoría'
        options={categories}
        optionValue='_id'
        optionLabel='name'
        error={!!errors.category} {...register('category', { required: true })}
        errorText='Selecciona una categoría'
        size={6}
      />

      <InputForm
        id='amount' label='Total' placeholder='Importe'
        error={!!errors.amount} {...register('amount', { required: true, valueAsNumber: true })}
        errorText='Introduce un importe válido'
        type='number' inputProps={{ step: 'any' }}
        size={6}
      />

      <AutocompleteForm
        options={stores}
        optionLabel='name' id='store' label='Comercio'
        placeholder='Comercio'
        error={!!errors.store}
        errorText='Introduce un comercio válido'
        size={6}
        {...register('store')}
        {...(ticket.store && { defaultValue: ticket.store })}
      />

      {ticket.payment_method && (
        <Grid size={12}>
          <Alert severity='info' sx={{ py: 0 }}>
            Método de pago detectado: <strong>{ticket.payment_method}</strong>
          </Alert>
        </Grid>
      )}

      {ticket.raw_text && (
        <Grid size={12}>
          <Alert severity='info' icon={false} sx={{ py: 0, fontStyle: 'italic' }}>
            "{ticket.raw_text}"
          </Alert>
        </Grid>
      )}

      {error && (
        <Grid size={12}>
          <FormHelperText error>{error}</FormHelperText>
        </Grid>
      )}
    </ModalGrid>
  )
}

export default ReviewModal
