import { useForm, useWatch } from 'react-hook-form'
import { ModalGrid, InputForm, SelectForm } from 'components'
import { Typography, Grid } from '@mui/material'
import { SupplyInput, SupplyType, Supply } from 'types'

const SUPPLY_TYPE_OPTIONS: { value: SupplyType; label: string }[] = [
  { value: 'electricity', label: 'Electricidad' },
  { value: 'water', label: 'Agua' },
  { value: 'gas', label: 'Gas' },
  { value: 'internet', label: 'Internet' },
  { value: 'other', label: 'Otro' }
]

type Props = {
  supply?: Supply
  propertyId: string
  onClose: () => void
  onSubmit: (data: SupplyInput) => Promise<{ error?: string }>
}

const SupplyForm = ({ supply, propertyId, onClose, onSubmit }: Props) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<SupplyInput>({
    defaultValues: supply
      ? {
          name: supply.name,
          type: supply.type,
          propertyId: supply.propertyId,
          contractedPowerPeak: supply.contractedPowerPeak,
          contractedPowerOffPeak: supply.contractedPowerOffPeak,
          currentPricePowerPeak: supply.currentPricePowerPeak,
          currentPricePowerOffPeak: supply.currentPricePowerOffPeak,
          currentPriceEnergyPeak: supply.currentPriceEnergyPeak,
          currentPriceEnergyFlat: supply.currentPriceEnergyFlat,
          currentPriceEnergyOffPeak: supply.currentPriceEnergyOffPeak
        }
      : { propertyId }
  })

  const selectedType = useWatch({ control, name: 'type' })
  const isOther = selectedType === 'other'
  const isElectricity = selectedType === 'electricity'

  const handleFormSubmit = handleSubmit(async (data) => {
    const result = await onSubmit({
      ...data,
      name: isOther ? data.name : undefined,
      contractedPowerPeak: isElectricity ? data.contractedPowerPeak : undefined,
      contractedPowerOffPeak: isElectricity ? data.contractedPowerOffPeak : undefined,
      currentPricePowerPeak: isElectricity ? data.currentPricePowerPeak : undefined,
      currentPricePowerOffPeak: isElectricity ? data.currentPricePowerOffPeak : undefined,
      currentPriceEnergyPeak: isElectricity ? data.currentPriceEnergyPeak : undefined,
      currentPriceEnergyFlat: isElectricity ? data.currentPriceEnergyFlat : undefined,
      currentPriceEnergyOffPeak: isElectricity ? data.currentPriceEnergyOffPeak : undefined
    })
    if (!result?.error) {
      onClose()
    }
  })

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
          <InputForm
            id='supply-power-peak'
            label='Potencia Punta (kW)'
            placeholder='Ej. 4.6'
            type='number'
            inputProps={{ step: 'any' }}
            size={6}
            error={Boolean(errors.contractedPowerPeak)}
            errorText='Obligatorio'
            {...register('contractedPowerPeak', { required: isElectricity, valueAsNumber: true })}
          />
          <InputForm
            id='supply-power-offpeak'
            label='Potencia Valle (kW)'
            placeholder='Ej. 4.6'
            type='number'
            inputProps={{ step: 'any' }}
            size={6}
            error={Boolean(errors.contractedPowerOffPeak)}
            errorText='Obligatorio'
            {...register('contractedPowerOffPeak', { required: isElectricity, valueAsNumber: true })}
          />

          <Grid size={12}>
            <Typography variant='subtitle1' sx={{ mt: 2, fontWeight: 700 }}>
              Precios de tu tarifa actual
            </Typography>
          </Grid>
          <InputForm
            id='current-price-power-peak'
            label='Precio Potencia Punta (€/kW/día)'
            placeholder='Ej. 0.080533'
            type='number'
            inputProps={{ step: 'any' }}
            size={6}
            error={Boolean(errors.currentPricePowerPeak)}
            errorText='Obligatorio'
            {...register('currentPricePowerPeak', { required: isElectricity, valueAsNumber: true })}
          />
          <InputForm
            id='current-price-power-offpeak'
            label='Precio Potencia Valle (€/kW/día)'
            placeholder='Ej. 0.007407'
            type='number'
            inputProps={{ step: 'any' }}
            size={6}
            error={Boolean(errors.currentPricePowerOffPeak)}
            errorText='Obligatorio'
            {...register('currentPricePowerOffPeak', { required: isElectricity, valueAsNumber: true })}
          />
          <InputForm
            id='current-price-energy-peak'
            label='Precio Energía Punta (€/kWh)'
            placeholder='Ej. 0.187021'
            type='number'
            inputProps={{ step: 'any' }}
            size={4}
            error={Boolean(errors.currentPriceEnergyPeak)}
            errorText='Obligatorio'
            {...register('currentPriceEnergyPeak', { required: isElectricity, valueAsNumber: true })}
          />
          <InputForm
            id='current-price-energy-flat'
            label='Precio Energía Llana (€/kWh)'
            placeholder='Ej. 0.135066'
            type='number'
            inputProps={{ step: 'any' }}
            size={4}
            error={Boolean(errors.currentPriceEnergyFlat)}
            errorText='Obligatorio'
            {...register('currentPriceEnergyFlat', { required: isElectricity, valueAsNumber: true })}
          />
          <InputForm
            id='current-price-energy-offpeak'
            label='Precio Energía Valle (€/kWh)'
            placeholder='Ej. 0.085298'
            type='number'
            inputProps={{ step: 'any' }}
            size={4}
            error={Boolean(errors.currentPriceEnergyOffPeak)}
            errorText='Obligatorio'
            {...register('currentPriceEnergyOffPeak', { required: isElectricity, valueAsNumber: true })}
          />
        </>
      )}
    </ModalGrid>
  )
}

export default SupplyForm
