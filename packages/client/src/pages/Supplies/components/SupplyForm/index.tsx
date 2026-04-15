import { useForm, useWatch } from 'react-hook-form'
import { ModalGrid, InputForm, SelectForm } from 'components'
import { Typography, Grid, Alert, Box } from '@mui/material'
import { SupplyInput, Supply } from 'types'
import {
  SUPPLY_TYPE_OPTIONS,
  CONTRACTED_POWER_FIELDS,
  CURRENT_PRICES_FIELDS,
  ElectricityFieldConfig
} from './config'
import { getDefaultValues, buildSubmitPayload } from './helpers'

type Props = {
  supply?: Supply
  propertyId: string
  onClose: () => void
  onSubmit: (data: SupplyInput) => Promise<{ error?: string }>
}

const SupplyForm = ({ supply, propertyId, onClose, onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
    clearErrors
  } = useForm<SupplyInput>({
    defaultValues: getDefaultValues(supply, propertyId)
  })

  const selectedType = useWatch({ control, name: 'type' })
  const isOther = selectedType === 'other'
  const isElectricity = selectedType === 'electricity'

  const handleFormSubmit = handleSubmit(async (data) => {
    clearErrors()
    const result = await onSubmit(buildSubmitPayload(data, isOther, isElectricity))
    if (result?.error) {
      setError('root', { type: 'manual', message: result.error })
      return
    }
    onClose()
  })

  const renderElectricityField = (field: ElectricityFieldConfig) => (
    <InputForm
      key={field.id}
      id={field.id}
      label={field.label}
      placeholder={field.placeholder}
      type='number'
      inputProps={{ step: 'any' }}
      size={field.size}
      error={Boolean(errors[field.fieldName])}
      errorText='Obligatorio'
      {...register(field.fieldName, { required: isElectricity, valueAsNumber: true })}
    />
  )

  return (
    <ModalGrid
      show
      title={supply ? 'Editar suministro' : 'Nuevo suministro'}
      onClose={onClose}
      action={handleFormSubmit}
      cardSx={{ minWidth: 480 }}
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

      {isElectricity && (
        <>
          {CONTRACTED_POWER_FIELDS.map(renderElectricityField)}

          <Grid size={12}>
            <Typography variant='subtitle1' sx={{ mt: 2, fontWeight: 700 }}>
              Precios de tu tarifa actual
            </Typography>
          </Grid>

          {CURRENT_PRICES_FIELDS.map(renderElectricityField)}
        </>
      )}

      {errors.root && (
        <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
          <Alert severity='error'>{errors.root.message}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default SupplyForm
