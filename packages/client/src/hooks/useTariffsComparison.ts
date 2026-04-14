import useSWR from 'swr'
import { TARIFFS_COMPARISON } from 'constants/api-paths'

export interface TariffComparison {
  comercializadora: string
  nombreTarifa: string
  potenciaPunta: number
  potenciaValle: number
  energiaPunta: number
  energiaLlana: number
  energiaValle: number
  totalAnualEstimado: number
  ahorroAnualEstimado: number
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
