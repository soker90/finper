import { SupplyModel, SupplyReadingModel, SUPPLY_TYPE, ISupplyReading } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

const TARIFFS_URL = 'https://soker90.github.io/tarifas-luz/tarifas.json'
const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 horas

interface ITariffData {
  datosGenerales: {
    iva: number
    impuestoElectrico: number
    alquilerContador: number
  }
  tarifas: Array<{
    comercializadora: string
    detalles: {
      nombreTarifa: string
      potenciaPunta: number
      potenciaValle: number
      periodos: number
      energiaPunta: number
      energiaLlana: number
      energiaValle: number
    }
  }>
}

interface ITariffPrices {
  potenciaPunta: number
  potenciaValle: number
  energiaPunta: number
  energiaLlana: number
  energiaValle: number
}

export default class TariffsService {
  private cachedTariffs: ITariffData | null = null
  private lastFetch: number = 0

  private async fetchTariffs (): Promise<ITariffData> {
    const now = Date.now()
    if (this.cachedTariffs && (now - this.lastFetch < CACHE_DURATION)) {
      return this.cachedTariffs
    }

    try {
      const response = await fetch(TARIFFS_URL)
      if (!response.ok) throw new Error('Failed to fetch tariffs')
      const data = await response.json() as ITariffData
      this.cachedTariffs = data
      this.lastFetch = now
      return data
    } catch {
      if (this.cachedTariffs) return this.cachedTariffs
      throw Boom.badGateway('No se pudieron obtener las tarifas eléctricas').output
    }
  }

  private calculateInvoiceCost (
    reading: Pick<ISupplyReading, 'consumptionPeak' | 'consumptionFlat' | 'consumptionOffPeak'>,
    contractedPowerPeak: number,
    contractedPowerOffPeak: number,
    prices: ITariffPrices,
    diasFacturados: number,
    iva: number,
    impuestoElectrico: number,
    alquilerContador: number
  ): number {
    const costePotencia =
      ((contractedPowerPeak * prices.potenciaPunta) + (contractedPowerOffPeak * prices.potenciaValle)) * diasFacturados
    const costeEnergia =
      ((reading.consumptionPeak || 0) * prices.energiaPunta) +
      ((reading.consumptionFlat || 0) * prices.energiaLlana) +
      ((reading.consumptionOffPeak || 0) * prices.energiaValle)
    const baseImponible = costePotencia + costeEnergia
    const totalConImpuestoElectrico = baseImponible * (1 + impuestoElectrico)
    return (totalConImpuestoElectrico + (alquilerContador * diasFacturados)) * (1 + iva)
  }

  public async compareTariffs (supplyId: string, user: string) {
    const supply = await SupplyModel.findOne({ _id: supplyId, user })
    if (!supply) throw Boom.notFound(ERROR_MESSAGE.SUPPLY.NOT_FOUND).output

    if (supply.type !== SUPPLY_TYPE.ELECTRICITY) {
      throw Boom.badRequest('La comparación de tarifas solo está disponible para suministros eléctricos').output
    }

    if (supply.contractedPowerPeak === undefined || supply.contractedPowerOffPeak === undefined) {
      throw Boom.badRequest('El suministro debe tener configuradas las potencias contratadas (Punta y Valle)').output
    }

    if (
      supply.currentPricePowerPeak === undefined ||
      supply.currentPricePowerOffPeak === undefined ||
      supply.currentPriceEnergyPeak === undefined ||
      supply.currentPriceEnergyFlat === undefined ||
      supply.currentPriceEnergyOffPeak === undefined
    ) {
      throw Boom.badRequest('El suministro debe tener configurados todos los precios actuales de energía y potencia').output
    }

    // Buscar la última lectura para determinar el periodo de 365 días
    const lastReading = await SupplyReadingModel.findOne({ supplyId, user }).sort({ endDate: -1 })
    if (!lastReading) {
      throw Boom.badRequest('El suministro no tiene lecturas registradas para realizar la comparación').output
    }

    const maxEndDate = lastReading.endDate
    const minStartDate = maxEndDate - (365 * 24 * 60 * 60 * 1000)

    const readings = await SupplyReadingModel.find({
      supplyId,
      user,
      endDate: { $lte: maxEndDate },
      startDate: { $gte: minStartDate }
    })

    if (readings.length === 0) {
      throw Boom.badRequest('No se han encontrado lecturas en el último año para este suministro').output
    }

    const data = await this.fetchTariffs()
    const { iva, impuestoElectrico, alquilerContador } = data.datosGenerales

    const currentTariffPrices: ITariffPrices = {
      potenciaPunta: supply.currentPricePowerPeak,
      potenciaValle: supply.currentPricePowerOffPeak,
      energiaPunta: supply.currentPriceEnergyPeak,
      energiaLlana: supply.currentPriceEnergyFlat,
      energiaValle: supply.currentPriceEnergyOffPeak
    }

    const comparison = data.tarifas.map(t => {
      const { potenciaPunta, potenciaValle, energiaPunta, energiaLlana, energiaValle } = t.detalles
      const newTariffPrices: ITariffPrices = { potenciaPunta, potenciaValle, energiaPunta, energiaLlana, energiaValle }

      const simulatedInvoices = readings.map(r => {
        const diasFacturados = (r.endDate - r.startDate) / (1000 * 60 * 60 * 24)

        const newTariffSimulatedAmount = this.calculateInvoiceCost(
          r, supply.contractedPowerPeak!, supply.contractedPowerOffPeak!,
          newTariffPrices, diasFacturados, iva, impuestoElectrico, alquilerContador
        )
        const currentTariffSimulatedAmount = this.calculateInvoiceCost(
          r, supply.contractedPowerPeak!, supply.contractedPowerOffPeak!,
          currentTariffPrices, diasFacturados, iva, impuestoElectrico, alquilerContador
        )

        return {
          startDate: r.startDate,
          endDate: r.endDate,
          realAmount: r.amount,
          currentTariffSimulatedAmount: Number(currentTariffSimulatedAmount.toFixed(2)),
          newTariffSimulatedAmount: Number(newTariffSimulatedAmount.toFixed(2))
        }
      })

      const totalAnualEstimado = simulatedInvoices.reduce((acc, inv) => acc + inv.newTariffSimulatedAmount, 0)
      const currentTotalSimulated = simulatedInvoices.reduce((acc, inv) => acc + inv.currentTariffSimulatedAmount, 0)
      const ahorroAnualEstimado = currentTotalSimulated - totalAnualEstimado

      return {
        comercializadora: t.comercializadora,
        nombreTarifa: t.detalles.nombreTarifa,
        potenciaPunta,
        potenciaValle,
        energiaPunta,
        energiaLlana,
        energiaValle,
        totalAnualEstimado: Number(totalAnualEstimado.toFixed(2)),
        ahorroAnualEstimado: Number(ahorroAnualEstimado.toFixed(2)),
        invoices: simulatedInvoices
      }
    })

    return comparison.sort((a, b) => b.ahorroAnualEstimado - a.ahorroAnualEstimado)
  }
}
