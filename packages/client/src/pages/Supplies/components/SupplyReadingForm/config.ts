import { SUPPLY_TYPE_UNITS, SupplyType } from '../../utils/supply'

export const DECIMAL_PATTERN = /^[0-9]+([.,][0-9]+)?$/

export const ERROR_MESSAGES = {
  required: 'El importe es obligatorio',
  invalidNumber: 'Introduce un número válido'
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

const DECIMAL_INPUT_PROPS = { inputMode: 'decimal' }

export interface FieldConfig {
  id: string
  label: string
  type: 'date' | 'text'
  size: number
  placeholder?: string
  inputProps?: Record<string, unknown>
  required?: boolean
}

export const COMMON_FIELDS: FieldConfig[] = [
  { id: 'startDate', label: FIELD_LABELS.startDate, type: 'date', size: 6, placeholder: 'DD/MM/YYYY' },
  { id: 'endDate', label: FIELD_LABELS.endDate, type: 'date', size: 6, placeholder: 'DD/MM/YYYY' },
  { id: 'amount', label: FIELD_LABELS.amount, type: 'text', size: 12, inputProps: DECIMAL_INPUT_PROPS, required: true }
]

export const ELECTRICITY_FIELDS: FieldConfig[] = [
  { id: 'consumptionPeak', label: FIELD_LABELS.consumptionPeak, type: 'text', size: 4, inputProps: DECIMAL_INPUT_PROPS },
  { id: 'consumptionFlat', label: FIELD_LABELS.consumptionFlat, type: 'text', size: 4, inputProps: DECIMAL_INPUT_PROPS },
  { id: 'consumptionOffPeak', label: FIELD_LABELS.consumptionOffPeak, type: 'text', size: 4, inputProps: DECIMAL_INPUT_PROPS }
]

export const getSupplyTypeField = (supplyType: SupplyType): FieldConfig => {
  const unit = SUPPLY_TYPE_UNITS[supplyType]
  return {
    id: 'consumption',
    label: `${FIELD_LABELS.consumption}${unit ? ` (${unit})` : ''}`,
    type: 'text',
    size: 12,
    inputProps: DECIMAL_INPUT_PROPS
  }
}
