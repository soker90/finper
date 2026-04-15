import dayjs from 'dayjs'
import { Supply, SupplyReadingInput } from 'types'

interface FormValues {
  startDate: string | null
  endDate: string | null
  amount: string
  consumption: string
  consumptionPeak: string
  consumptionFlat: string
  consumptionOffPeak: string
}

export const parseDecimalInput = (value: string): number => {
  const normalized = value.replace(',', '.').trim()
  return Number(normalized)
}

const parseOptionalDecimal = (value: string | undefined): number | undefined =>
  value ? parseDecimalInput(value) : undefined

export const buildSubmitPayload = (
  data: FormValues,
  supply: Supply
): Omit<SupplyReadingInput, 'supplyId'> => {
  const isElectricity = supply.type === 'electricity'

  return {
    startDate: dayjs(data.startDate!).startOf('day').valueOf(),
    endDate: dayjs(data.endDate!).startOf('day').valueOf(),
    amount: parseDecimalInput(data.amount),
    ...(isElectricity
      ? {
          consumptionPeak: parseOptionalDecimal(data.consumptionPeak),
          consumptionFlat: parseOptionalDecimal(data.consumptionFlat),
          consumptionOffPeak: parseOptionalDecimal(data.consumptionOffPeak)
        }
      : {
          consumption: parseOptionalDecimal(data.consumption)
        })
  }
}

export const getDefaultValues = (reading: any) => {
  if (!reading) {
    return { startDate: null, endDate: null, amount: '', consumption: '', consumptionPeak: '', consumptionFlat: '', consumptionOffPeak: '' }
  }

  return {
    startDate: dayjs(reading.startDate).format('YYYY-MM-DD'),
    endDate: dayjs(reading.endDate).format('YYYY-MM-DD'),
    amount: reading.amount?.toString() ?? '',
    consumption: reading.consumption?.toString() ?? '',
    consumptionPeak: reading.consumptionPeak?.toString() ?? '',
    consumptionFlat: reading.consumptionFlat?.toString() ?? '',
    consumptionOffPeak: reading.consumptionOffPeak?.toString() ?? ''
  }
}
