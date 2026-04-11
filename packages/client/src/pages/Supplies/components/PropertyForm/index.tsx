import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import { PropertyInput } from 'types'

type Props = {
  property?: { _id: string; name: string }
  onClose: () => void
  onSubmit: (data: PropertyInput) => Promise<{ error?: string }>
}

const PropertyForm = ({ property, onClose, onSubmit }: Props) => {
  const defaultValues = property ? { name: property.name } : {}

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PropertyInput>({ defaultValues })

  const [submitError, setSubmitError] = useState<string | null>(null)

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
      title={property ? 'Editar inmueble' : 'Nuevo inmueble'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <InputForm
        id='property-name'
        label='Nombre'
        placeholder='Ej. Casa principal'
        size={12}
        error={Boolean(errors.name)}
        errorText='El nombre es obligatorio'
        {...register('name', { required: true })}
      />

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default PropertyForm
