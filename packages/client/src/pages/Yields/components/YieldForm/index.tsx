import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import SelectForm from 'components/forms/SelectForm'
import { useAccounts } from 'hooks/useAccounts'
import { useCategories } from 'hooks/useCategories'
import { Yield, YieldInput } from 'types'

const YIELD_TYPE_OPTIONS = [
  { value: 'interest', label: 'Intereses' },
  { value: 'cashback', label: 'Cashback' }
]

type Props = {
  editingYield?: Yield
  onClose: () => void
  onSubmit: (data: YieldInput) => Promise<{ error?: string }>
}

const YieldForm = ({ editingYield, onClose, onSubmit }: Props) => {
  const { accounts } = useAccounts()
  const { categories } = useCategories()

  const defaultValues = editingYield
    ? {
        type: editingYield.type,
        accountId: editingYield.account._id,
        categoryId: editingYield.categoryId
      }
    : {
        type: 'interest' as const
      }

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<YieldInput>({
    defaultValues
  })

  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    reset(defaultValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset(defaultValues) on external prop change; defaultValues is rebuilt each render by design
  }, [reset, editingYield, accounts, categories])

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
      title={editingYield ? 'Editar rendimiento' : 'Nuevo rendimiento'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <SelectForm
        id='type'
        label='Tipo'
        size={6}
        options={YIELD_TYPE_OPTIONS}
        optionValue='value'
        optionLabel='label'
        error={Boolean(errors.type)}
        errorText='El tipo es obligatorio'
        {...register('type', { required: true })}
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

      <SelectForm
        id='categoryId'
        label='Categoría principal'
        size={12}
        options={categories}
        optionValue='_id'
        optionLabel='name'
        voidOption
        error={Boolean(errors.categoryId)}
        errorText='La categoría es obligatoria'
        {...register('categoryId', { required: true })}
      />

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default YieldForm
