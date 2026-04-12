import { useForm } from 'react-hook-form'
import dayjs from 'dayjs'
import { DateForm, InputForm, ModalGrid } from 'components'
import { Supply, SupplyReading, SupplyReadingInput } from 'types'
import { SUPPLY_TYPE_UNITS } from '../../utils/supply'

interface FormValues {
  startDate: string | null
  endDate: string | null
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
  const unit = SUPPLY_TYPE_UNITS[supply.type]

  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<FormValues>({
    defaultValues: reading
      ? {
          startDate: dayjs(reading.startDate).format('YYYY-MM-DD'),
          endDate: dayjs(reading.endDate).format('YYYY-MM-DD'),
          consumption: reading.consumption,
          consumptionPeak: reading.consumptionPeak,
          consumptionFlat: reading.consumptionFlat,
          consumptionOffPeak: reading.consumptionOffPeak
        }
      : { startDate: null, endDate: null }
  })

  const handleFormSubmit = handleSubmit(async (data) => {
    const result = await onSubmit({
      startDate: dayjs(data.startDate!).startOf('day').valueOf(),
      endDate: dayjs(data.endDate!).startOf('day').valueOf(),
      ...(isElectricity
        ? {
            consumptionPeak: data.consumptionPeak !== undefined ? Number(data.consumptionPeak) : undefined,
            consumptionFlat: data.consumptionFlat !== undefined ? Number(data.consumptionFlat) : undefined,
            consumptionOffPeak: data.consumptionOffPeak !== undefined ? Number(data.consumptionOffPeak) : undefined
          }
        : {
            consumption: data.consumption !== undefined ? Number(data.consumption) : undefined
          })
    })
    if (!result?.error) onClose()
  })

  return (
    <ModalGrid
      show
      title={reading ? 'Editar lectura' : 'Nueva lectura'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
      cardSx={{ minWidth: 520 }}
    >
      <DateForm
        id='startDate'
        label='Fecha inicio'
        placeholder='DD/MM/YYYY'
        error={!!errors.startDate}
        control={control}
        size={6}
      />
      <DateForm
        id='endDate'
        label='Fecha fin'
        placeholder='DD/MM/YYYY'
        error={!!errors.endDate}
        control={control}
        size={6}
      />

      {isElectricity
        ? (
          <>
            <InputForm
              id='consumptionPeak'
              label='Punta (kWh)'
              type='number'
              size={4}
              error={!!errors.consumptionPeak}
              errorText={errors.consumptionPeak?.message ?? ''}
              {...register('consumptionPeak', { valueAsNumber: true })}
            />
            <InputForm
              id='consumptionFlat'
              label='Llano (kWh)'
              type='number'
              size={4}
              error={!!errors.consumptionFlat}
              errorText={errors.consumptionFlat?.message ?? ''}
              {...register('consumptionFlat', { valueAsNumber: true })}
            />
            <InputForm
              id='consumptionOffPeak'
              label='Valle (kWh)'
              type='number'
              size={4}
              error={!!errors.consumptionOffPeak}
              errorText={errors.consumptionOffPeak?.message ?? ''}
              {...register('consumptionOffPeak', { valueAsNumber: true })}
            />
          </>
          )
        : (
          <InputForm
            id='consumption'
            label={`Consumo${unit ? ` (${unit})` : ''}`}
            type='number'
            size={12}
            error={!!errors.consumption}
            errorText={errors.consumption?.message ?? ''}
            {...register('consumption', { valueAsNumber: true })}
          />
          )}
    </ModalGrid>
  )
}

export default SupplyReadingForm
