import { SUPPLY_TYPE_UNITS, SupplyType } from '../../utils/supply'

export const ERROR_MESSAGES = {
  amount: {
    required: 'El importe es obligatorio y debe ser un número válido',
    invalid: 'El importe es obligatorio y debe ser un número válido'
  }
}

export const FIELD_LABELS = {
  startDate: 'Fecha inicio',
  endDate: 'Fecha fin',
  amount: 'Importe (€)',
  consumption: 'Consumo',
  consumptionPeak: 'Punta (kWh)',
  consumptionFlat: 'Llano (kWh)',
  consumptionOffPeak: 'Valle (kWh)'
}

export interface FieldConfig {
  id: string
  label: string
  type: 'date' | 'text' | 'number'
  size: number
  placeholder?: string
  inputProps?: Record<string, unknown>
  valueAsNumber?: boolean
}

export const COMMON_FIELDS: FieldConfig[] = [
  {
    id: 'startDate',
    label: FIELD_LABELS.startDate,
    type: 'date',
    size: 6,
    placeholder: 'DD/MM/YYYY'
  },
  {
    id: 'endDate',
    label: FIELD_LABELS.endDate,
    type: 'date',
    size: 6,
    placeholder: 'DD/MM/YYYY'
  },
  {
    id: 'amount',
    label: FIELD_LABELS.amount,
    type: 'text',
    size: 12,
    inputProps: { inputMode: 'decimal' }
  }
]

export const ELECTRICITY_FIELDS: FieldConfig[] = [
  {
    id: 'consumptionPeak',
    label: FIELD_LABELS.consumptionPeak,
    type: 'number',
    size: 4,
    valueAsNumber: true
  },
  {
    id: 'consumptionFlat',
    label: FIELD_LABELS.consumptionFlat,
    type: 'number',
    size: 4,
    valueAsNumber: true
  },
  {
    id: 'consumptionOffPeak',
    label: FIELD_LABELS.consumptionOffPeak,
    type: 'number',
    size: 4,
    valueAsNumber: true
  }
]

export const getSupplyTypeField = (supplyType: SupplyType): FieldConfig => {
  const unit = SUPPLY_TYPE_UNITS[supplyType]
  return {
    id: 'consumption',
    label: `${FIELD_LABELS.consumption}${unit ? ` (${unit})` : ''}`,
    type: 'number',
    size: 12,
    valueAsNumber: true
  }
}
