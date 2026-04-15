import { useForm } from 'react-hook-form'
import { DateForm, InputForm, ModalGrid } from 'components'
import { Supply, SupplyReading, SupplyReadingInput } from 'types'
import {
  COMMON_FIELDS,
  ELECTRICITY_FIELDS,
  ERROR_MESSAGES,
  getSupplyTypeField,
  FieldConfig
} from './config'
import {
  parseAmountInput,
  validateAmount,
  buildSubmitPayload,
  getDefaultValues
} from './helpers'

interface FormValues {
  startDate: string | null
  endDate: string | null
  amount?: string | number
  consumption?: number
  consumptionPeak?: number
  consumptionFlat?: number
  consumptionOffPeak?: number
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
    const parsedAmount = parseAmountInput(data.amount)
    if (!Number.isFinite(parsedAmount)) {
      setError('amount', {
        type: 'validate',
        message: ERROR_MESSAGES.amount.required
      })
      return
    }

    clearErrors('amount')

    const payload = buildSubmitPayload(data, supply)
    const result = await onSubmit(payload)
    if (!result?.error) onClose()
  })

  const renderField = (field: FieldConfig) => {
    if (field.type === 'date') {
      return (
        <DateForm
          key={field.id}
          id={field.id}
          label={field.label}
          placeholder={field.placeholder}
          error={!!errors[field.id as keyof FormValues]}
          control={control}
          size={field.size}
        />
      )
    }

    const isAmountField = field.id === 'amount'
    const fieldErrors = errors[field.id as keyof FormValues]

    return (
      <InputForm
        key={field.id}
        id={field.id}
        label={field.label}
        type={field.type}
        size={field.size}
        inputProps={field.inputProps}
        error={!!fieldErrors}
        errorText={
          isAmountField
            ? fieldErrors?.message ?? ERROR_MESSAGES.amount.required
            : fieldErrors?.message ?? ''
        }
        {...register(field.id as keyof FormValues, {
          ...(isAmountField && {
            required: true,
            validate: validateAmount
          }),
          ...(field.valueAsNumber && { valueAsNumber: true })
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
      cardSx={{ minWidth: 520 }}
    >
      {COMMON_FIELDS.map(renderField)}
      {consumptionFields.map(renderField)}
    </ModalGrid>
  )
}

export default SupplyReadingForm
