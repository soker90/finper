import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import { useAccounts } from 'hooks/useAccounts'
import { addCreditCard, editCreditCard } from 'services/apiService'
import { BANK_OPTIONS } from 'constants/banks'
import { getId } from 'utils'
import { useSubmitError } from '../hooks/useSubmitError'
import type { CreditCard } from 'types'

interface CreditCardFormValues {
  name: string
  accountId: string
  limit: string
  logoBank: string
}

interface ModalCreditCardProps {
  open: boolean
  onClose: () => void
  creditCard?: CreditCard | null
  onSuccess: () => void
}

export const ModalCreditCard = ({ open, onClose, creditCard, onSuccess }: ModalCreditCardProps) => {
  const { accounts } = useAccounts()

  const defaultValues: CreditCardFormValues = creditCard
    ? {
        name: creditCard.name || '',
        accountId: creditCard.accountId || '',
        limit: creditCard.limit !== undefined && creditCard.limit !== null ? String(creditCard.limit) : '',
        logoBank: creditCard.logoBank || ''
      }
    : {
        name: '',
        accountId: '',
        limit: '',
        logoBank: ''
      }

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<CreditCardFormValues>({
    defaultValues
  })

  useEffect(() => {
    reset(defaultValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset(defaultValues) on external prop change (open/creditCard); defaultValues is rebuilt each render by design
  }, [reset, open, creditCard])

  const { error: submitError, runSubmit } = useSubmitError()

  const handleFormSubmit = handleSubmit((data) => runSubmit(async () => {
    const payload = {
      name: data.name.trim(),
      accountId: data.accountId,
      limit: data.limit.trim() ? parseFloat(data.limit) : null,
      logoBank: data.logoBank || null
    }
    if (creditCard) {
      const id = getId(creditCard)
      if (!id) return { error: 'No se pudo identificar la tarjeta a editar' }
      return editCreditCard(id, payload)
    }
    return addCreditCard(payload)
  }, () => {
    onSuccess()
    onClose()
  }))

  if (!open) return null

  return (
    <ModalGrid
      show={open}
      title={creditCard ? 'Editar tarjeta de crédito' : 'Nueva tarjeta de crédito'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <InputForm
        id='name'
        label='Nombre de la tarjeta'
        placeholder='Ej. Visa Pass, Tarjeta Oro'
        size={6}
        error={Boolean(errors.name)}
        errorText='El nombre de la tarjeta es obligatorio'
        {...register('name', { required: true })}
      />

      <InputForm
        id='limit'
        label='Límite de crédito (€)'
        placeholder='Ej. 1500 (opcional)'
        type='number'
        size={6}
        error={false}
        errorText=''
        inputProps={{ step: '0.01', min: '0' }}
        {...register('limit')}
      />

      <Controller
        name='accountId'
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <SelectForm
            id='accountId'
            label='Cuenta asociada para el cobro'
            size={6}
            options={accounts}
            optionValue='_id'
            optionLabel='name'
            voidOption
            error={Boolean(errors.accountId)}
            errorText='Debes seleccionar una cuenta asociada'
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            inputRef={field.ref}
          />
        )}
      />

      <SelectForm
        id='logoBank'
        label='Logo de la tarjeta'
        size={6}
        options={BANK_OPTIONS}
        optionValue='value'
        optionLabel='label'
        voidOption
        voidLabel='Usar el logo del banco de la cuenta'
        voidValue=''
        error={false}
        errorText=''
        {...register('logoBank')}
      />

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}
