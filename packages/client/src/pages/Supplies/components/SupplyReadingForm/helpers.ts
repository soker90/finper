import dayjs from 'dayjs'
import { Supply, SupplyReadingInput } from 'types'
import { ERROR_MESSAGES } from './config'

interface FormValues {
  startDate: string | null
  endDate: string | null
  amount?: string | number
  consumption?: number
  consumptionPeak?: number
  consumptionFlat?: number
  consumptionOffPeak?: number
}

export const parseAmountInput = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return Number.NaN

  const normalized = value.replace(',', '.').trim()
  if (normalized === '') return Number.NaN

  return Number(normalized)
}

export const validateAmount = (value: unknown): boolean | string => {
  const parsed = parseAmountInput(value)
  return Number.isFinite(parsed) || ERROR_MESSAGES.amount.invalid
}

export const buildSubmitPayload = (
  data: FormValues,
  supply: Supply
): Omit<SupplyReadingInput, 'supplyId'> => {
  const isElectricity = supply.type === 'electricity'

  return {
    startDate: dayjs(data.startDate!).startOf('day').valueOf(),
    endDate: dayjs(data.endDate!).startOf('day').valueOf(),
    amount: parseAmountInput(data.amount),
    ...(isElectricity
      ? {
          consumptionPeak: data.consumptionPeak !== undefined ? Number(data.consumptionPeak) : undefined,
          consumptionFlat: data.consumptionFlat !== undefined ? Number(data.consumptionFlat) : undefined,
          consumptionOffPeak: data.consumptionOffPeak !== undefined ? Number(data.consumptionOffPeak) : undefined
        }
      : {
          consumption: data.consumption !== undefined ? Number(data.consumption) : undefined
        })
  }
}

export const getDefaultValues = (reading: any) => {
  if (!reading) {
    return { startDate: null, endDate: null }
  }

  return {
    startDate: dayjs(reading.startDate).format('YYYY-MM-DD'),
    endDate: dayjs(reading.endDate).format('YYYY-MM-DD'),
    amount: reading.amount,
    consumption: reading.consumption,
    consumptionPeak: reading.consumptionPeak,
    consumptionFlat: reading.consumptionFlat,
    consumptionOffPeak: reading.consumptionOffPeak
  }
}
