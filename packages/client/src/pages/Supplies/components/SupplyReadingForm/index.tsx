import { useForm } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import { DateForm, InputForm, ModalGrid } from 'components'
import { Supply, SupplyReading, SupplyReadingInput } from 'types'
import { COMMON_FIELDS, DECIMAL_PATTERN, ELECTRICITY_FIELDS, ERROR_MESSAGES, FieldConfig, getSupplyTypeField } from './config'
import { buildSubmitPayload, getDefaultValues } from './helpers'

interface FormValues {
  startDate: string | null
  endDate: string | null
  amount: string
  consumption: string
  consumptionPeak: string
  consumptionFlat: string
  consumptionOffPeak: string
}

interface Props {
  supply: Supply
  reading?: SupplyReading
  onClose: () => void
  onSubmit: (data: Omit<SupplyReadingInput, 'supplyId'>) => Promise<{ error?: string }>
}

const SupplyReadingForm = ({ supply, reading, onClose, onSubmit }: Props) => {
  const isElectricity = supply.type === 'electricity'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    setError,
    clearErrors
  } = useForm<FormValues>({
    defaultValues: getDefaultValues(reading)
  })

  const handleFormSubmit = handleSubmit(async (data) => {
    clearErrors()
    const result = await onSubmit(buildSubmitPayload(data, supply))
    if (result?.error) {
      if (result.error.toLowerCase().includes('fecha')) {
        setError('endDate', { type: 'manual', message: result.error })
      } else {
        setError('root', { type: 'manual', message: result.error })
      }
      return
    }
    onClose()
  })

  const renderField = (field: FieldConfig) => {
    if (field.type === 'date') {
      return (
        <DateForm
          key={field.id}
          id={field.id}
          label={field.label}
          placeholder={field.placeholder ?? ''}
          error={!!errors[field.id as keyof FormValues]}
          errorText={errors[field.id as keyof FormValues]?.message}
          control={control}
          size={field.size}
        />
      )
    }

    const fieldErrors = errors[field.id as keyof FormValues]

    return (
      <InputForm
        key={field.id}
        id={field.id}
        label={field.label}
        type='text'
        size={field.size}
        inputProps={field.inputProps}
        error={!!fieldErrors}
        errorText={fieldErrors?.message ?? ''}
        {...register(field.id as keyof FormValues, {
          ...(field.required && { required: ERROR_MESSAGES.required }),
          pattern: { value: DECIMAL_PATTERN, message: ERROR_MESSAGES.invalidNumber }
        })}
      />
    )
  }

  const consumptionFields = isElectricity
    ? ELECTRICITY_FIELDS
    : [getSupplyTypeField(supply.type)]

  return (
    <ModalGrid
      show
      title={reading ? 'Editar lectura' : 'Nueva lectura'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      {COMMON_FIELDS.map(renderField)}
      {consumptionFields.map(renderField)}

      {errors.root && (
        <Box sx={{ gridColumn: '1 / -1', mt: 1 }}>
          <Alert severity='error'>{errors.root.message}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default SupplyReadingForm
