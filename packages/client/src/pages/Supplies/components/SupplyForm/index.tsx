import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import { SupplyInput, SupplyType } from 'types'

const SUPPLY_TYPE_OPTIONS: { value: SupplyType; label: string }[] = [
  { value: 'electricity', label: 'Electricidad' },
  { value: 'water', label: 'Agua' },
  { value: 'gas', label: 'Gas' },
  { value: 'internet', label: 'Internet' },
  { value: 'other', label: 'Otro' }
]

type Props = {
  supply?: { _id: string; name?: string; type: SupplyType; propertyId: string }
  propertyId: string
  onClose: () => void
  onSubmit: (data: SupplyInput) => Promise<{ error?: string }>
}

const SupplyForm = ({ supply, propertyId, onClose, onSubmit }: Props) => {
  const defaultValues: Partial<SupplyInput> = supply
    ? { name: supply.name, type: supply.type, propertyId: supply.propertyId }
    : { propertyId }

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<SupplyInput>({ defaultValues })

  const selectedType = useWatch({ control, name: 'type' })
  const isOther = selectedType === 'other'

  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleFormSubmit = handleSubmit(async (data) => {
    setSubmitError(null)
    const result = await onSubmit({
      ...data,
      name: isOther ? data.name : undefined
    })
    if (result?.error) {
      setSubmitError(result.error)
      return
    }
    onClose()
  })

  return (
    <ModalGrid
      show
      title={supply ? 'Editar suministro' : 'Nuevo suministro'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <SelectForm
        id='supply-type'
        label='Tipo'
        size={12}
        options={SUPPLY_TYPE_OPTIONS}
        optionValue='value'
        optionLabel='label'
        error={Boolean(errors.type)}
        errorText='El tipo es obligatorio'
        {...register('type', { required: true })}
      />

      {isOther && (
        <InputForm
          id='supply-name'
          label='Nombre'
          placeholder='Ej. Comunidad'
          size={12}
          error={Boolean(errors.name)}
          errorText='El nombre es obligatorio'
          {...register('name', { required: isOther })}
        />
      )}

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default SupplyForm
