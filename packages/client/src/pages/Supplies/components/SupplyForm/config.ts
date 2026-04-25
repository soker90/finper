import { SupplyInput, SupplyType } from 'types'

export const SUPPLY_TYPE_OPTIONS: { value: SupplyType; label: string }[] = [
  { value: 'electricity', label: 'Electricidad' },
  { value: 'water', label: 'Agua' },
  { value: 'gas', label: 'Gas' },
  { value: 'other', label: 'Otro' }
]

export interface ElectricityFieldConfig {
  id: string
  fieldName: keyof SupplyInput
  label: string
  placeholder: string
  size: number
}

export const CONTRACTED_POWER_FIELDS: ElectricityFieldConfig[] = [
  {
    id: 'supply-power-peak',
    fieldName: 'contractedPowerPeak',
    label: 'Potencia Punta (kW)',
    placeholder: 'Ej. 4.6',
    size: 6
  },
  {
    id: 'supply-power-offpeak',
    fieldName: 'contractedPowerOffPeak',
    label: 'Potencia Valle (kW)',
    placeholder: 'Ej. 4.6',
    size: 6
  }
]

export const CURRENT_PRICES_FIELDS: ElectricityFieldConfig[] = [
  {
    id: 'current-price-power-peak',
    fieldName: 'currentPricePowerPeak',
    label: 'Precio Potencia Punta (€/kW/día)',
    placeholder: 'Ej. 0.080533',
    size: 6
  },
  {
    id: 'current-price-power-offpeak',
    fieldName: 'currentPricePowerOffPeak',
    label: 'Precio Potencia Valle (€/kW/día)',
    placeholder: 'Ej. 0.007407',
    size: 6
  },
  {
    id: 'current-price-energy-peak',
    fieldName: 'currentPriceEnergyPeak',
    label: 'Precio Energía Punta (€/kWh)',
    placeholder: 'Ej. 0.187021',
    size: 4
  },
  {
    id: 'current-price-energy-flat',
    fieldName: 'currentPriceEnergyFlat',
    label: 'Precio Energía Llana (€/kWh)',
    placeholder: 'Ej. 0.135066',
    size: 4
  },
  {
    id: 'current-price-energy-offpeak',
    fieldName: 'currentPriceEnergyOffPeak',
    label: 'Precio Energía Valle (€/kWh)',
    placeholder: 'Ej. 0.085298',
    size: 4
  }
]
