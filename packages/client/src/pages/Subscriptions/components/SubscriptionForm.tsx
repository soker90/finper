import { useForm } from 'react-hook-form'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import { useAccounts } from 'hooks/useAccounts'
import { useGroupedCategories } from 'hooks/useGroupedCategories'
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
  const { categories } = useGroupedCategories()
  const flatCategories = categories.flatMap((g) => g.children ?? [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SubscriptionInput>({
    defaultValues: subscription
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
  })

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
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
        errorText='El importe es obligatorio'
        {...register('amount', { required: true, valueAsNumber: true })}
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
        options={flatCategories}
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
    </ModalGrid>
  )
}

export default SubscriptionForm
