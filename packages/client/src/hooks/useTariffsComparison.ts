import useSWR from 'swr'
import { TARIFFS_COMPARISON } from 'constants/api-paths'

export interface TariffComparison {
  retailer: string
  tariffName: string
  peakPower: number
  offPeakPower: number
  peakEnergy: number
  flatEnergy: number
  offPeakEnergy: number
  estimatedAnnualTotal: number
  estimatedAnnualSavings: number
  firstYearTotal: number | null
  discount?: {
    tipo: 'porcentaje' | 'fijo'
    valor: number
    meses: number | null
    soloNuevosClientes: boolean
  } | null
  invoices: Array<{
    startDate: number
    endDate: number
    realAmount: number
    currentTariffSimulatedAmount: number
    newTariffSimulatedAmount: number
  }>
}

export const useTariffsComparison = (supplyId: string | undefined) => {
  const { data, error, isLoading } = useSWR<TariffComparison[]>(
    supplyId ? TARIFFS_COMPARISON(supplyId) : null
  )

  return {
    comparison: data,
    error,
    isLoading
  }
}
