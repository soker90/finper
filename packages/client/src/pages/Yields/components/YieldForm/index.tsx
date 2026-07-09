import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import { useAccounts } from 'hooks/useAccounts'
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

  const defaultValues = editingYield
    ? {
        name: editingYield.name,
        type: editingYield.type,
        accountId: editingYield.account._id
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
  }, [reset, editingYield, accounts])

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
      <InputForm
        id='name'
        label='Nombre'
        placeholder='Ej. Intereses Cuenta Naranja'
        size={6}
        error={Boolean(errors.name)}
        errorText='El nombre es obligatorio'
        {...register('name', { required: true })}
      />

      <SelectForm
        id='type'
        label='Tipo'
        size={3}
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
        size={3}
        options={accounts}
        optionValue='_id'
        optionLabel='name'
        voidOption
        error={Boolean(errors.accountId)}
        errorText='La cuenta es obligatoria'
        {...register('accountId', { required: true })}
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
