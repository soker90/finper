import { useForm } from 'react-hook-form'
import { ModalGrid, InputForm } from 'components'
import { PropertyInput } from 'types'

type Props = {
  property?: { _id: string; name: string }
  onClose: () => void
  onSubmit: (data: PropertyInput) => Promise<{ error?: string }>
}

const PropertyForm = ({ property, onClose, onSubmit }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm<PropertyInput>({
    defaultValues: property ? { name: property.name } : {}
  })

  const handleFormSubmit = handleSubmit(async (data) => {
    const result = await onSubmit(data)
    if (!result?.error) {
      onClose()
    }
  })

  return (
    <ModalGrid
      show
      title={property ? 'Editar inmueble' : 'Nuevo inmueble'}
      onClose={onClose}
      action={handleFormSubmit}
      cardSx={{ minWidth: 480 }}
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
    </ModalGrid>
  )
}

export default PropertyForm
