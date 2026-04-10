import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import { useAccounts } from 'hooks/useAccounts'
import { useCategories } from 'hooks/useCategories'
import { Subscription, SubscriptionInput, SubscriptionCycle } from 'types'

const CYCLE_OPTIONS = [
  { value: SubscriptionCycle.DAILY, label: 'Diario' },
  { value: SubscriptionCycle.WEEKLY, label: 'Semanal' },
  { value: SubscriptionCycle.MONTHLY, label: 'Mensual' },
  { value: SubscriptionCycle.QUARTERLY, label: 'Trimestral' },
  { value: SubscriptionCycle.SEMI_ANNUALLY, label: 'Semestral' },
  { value: SubscriptionCycle.ANNUALLY, label: 'Anual' }
]

type Props = {
  subscription?: Subscription
  onClose: () => void
  onSubmit: (data: SubscriptionInput) => Promise<{ error?: string }>
}

const SubscriptionForm = ({ subscription, onClose, onSubmit }: Props) => {
  const { accounts } = useAccounts()
  const { categories } = useCategories()

  const defaultValues = subscription
    ? {
        name: subscription.name,
        amount: subscription.amount,
        cycle: subscription.cycle,
        categoryId: subscription.categoryId?._id,
        accountId: subscription.accountId?._id,
        logoUrl: subscription.logoUrl ?? ''
      }
    : {
        cycle: SubscriptionCycle.MONTHLY
      }

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<SubscriptionInput>({
    defaultValues
  })

  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    reset(defaultValues)
  }, [reset, subscription, accounts, categories])

  const handleFormSubmit = handleSubmit(async (data) => {
    setSubmitError(null)
    const result = await onSubmit(data)
    if (result?.error) {
      setSubmitError(result.error)
      return
    }
    onClose()
  })

  return (
    <ModalGrid
      show
      title={subscription ? 'Editar suscripción' : 'Nueva suscripción'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <InputForm
        id='name'
        label='Nombre'
        placeholder='Ej. Netflix'
        size={6}
        error={Boolean(errors.name)}
        errorText='El nombre es obligatorio'
        {...register('name', { required: true })}
      />

      <InputForm
        id='amount'
        label='Importe (€)'
        placeholder='9.99'
        type='number'
        size={3}
        error={Boolean(errors.amount)}
        errorText='El importe debe ser mayor que 0'
        {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })}
      />

      <SelectForm
        id='cycle'
        label='Ciclo'
        size={3}
        options={CYCLE_OPTIONS}
        optionValue='value'
        optionLabel='label'
        {...register('cycle', { required: true })}
      />

      <SelectForm
        id='categoryId'
        label='Categoría'
        size={6}
        options={categories}
        optionValue='_id'
        optionLabel='name'
        voidOption
        error={Boolean(errors.categoryId)}
        errorText='La categoría es obligatoria'
        {...register('categoryId', { required: true })}
      />

      <SelectForm
        id='accountId'
        label='Cuenta'
        size={6}
        options={accounts}
        optionValue='_id'
        optionLabel='name'
        voidOption
        error={Boolean(errors.accountId)}
        errorText='La cuenta es obligatoria'
        {...register('accountId', { required: true })}
      />

      <InputForm
        id='logoUrl'
        label='URL del logo (opcional)'
        placeholder='https://...'
        size={12}
        error={false}
        errorText=''
        {...register('logoUrl')}
      />

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default SubscriptionForm
