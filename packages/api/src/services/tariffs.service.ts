import { SupplyModel, SupplyReadingModel, SupplyReadingDocument, ISupplyReading } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

const TARIFFS_URL = 'https://soker90.github.io/tarifas-luz/tarifas.json'
const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

// ── External API types (Spanish field names match the remote JSON) ─────────────

interface ITariffApiResponse {
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

// ── Internal types ────────────────────────────────────────────────────────────

interface ITariffPrices {
  peakPower: number
  offPeakPower: number
  peakEnergy: number
  flatEnergy: number
  offPeakEnergy: number
}

interface ITaxConfig {
  vat: number
  electricityTax: number
  meterRental: number
}

interface ITariffEntry {
  retailer: string
  tariffName: string
  prices: ITariffPrices
}

interface ITariffData {
  taxes: ITaxConfig
  tariffs: ITariffEntry[]
}

// ── Public types (used in the service interface) ──────────────────────────────

interface ISimulatedInvoice {
  startDate: number
  endDate: number
  realAmount: number
  currentTariffSimulatedAmount: number
  newTariffSimulatedAmount: number
}

export interface TariffComparisonResult {
  retailer: string
  tariffName: string
  peakPower: number
  offPeakPower: number
  peakEnergy: number
  flatEnergy: number
  offPeakEnergy: number
  estimatedAnnualTotal: number
  estimatedAnnualSavings: number
  invoices: ISimulatedInvoice[]
}

export interface ITariffsService {
  compareTariffs(supplyId: string, user: string): Promise<TariffComparisonResult[]>
}

// ── Implementation ────────────────────────────────────────────────────────────

export default class TariffsService implements ITariffsService {
  private cachedTariffs: ITariffData | null = null
  private lastFetch: number = 0

  private mapApiResponse (apiData: ITariffApiResponse): ITariffData {
    return {
      taxes: {
        vat: apiData.datosGenerales.iva,
        electricityTax: apiData.datosGenerales.impuestoElectrico,
        meterRental: apiData.datosGenerales.alquilerContador
      },
      tariffs: apiData.tarifas.map(entry => ({
        retailer: entry.comercializadora,
        tariffName: entry.detalles.nombreTarifa,
        prices: {
          peakPower: entry.detalles.potenciaPunta,
          offPeakPower: entry.detalles.potenciaValle,
          peakEnergy: entry.detalles.energiaPunta,
          flatEnergy: entry.detalles.energiaLlana,
          offPeakEnergy: entry.detalles.energiaValle
        }
      }))
    }
  }

  private async fetchTariffs (): Promise<ITariffData> {
    const now = Date.now()
    if (this.cachedTariffs && (now - this.lastFetch < CACHE_DURATION)) {
      return this.cachedTariffs
    }

    let freshData: ITariffData | null = null
    try {
      const response = await fetch(TARIFFS_URL)
      if (response.ok) {
        const apiData = await response.json() as ITariffApiResponse
        freshData = this.mapApiResponse(apiData)
      }
    } catch {
      // network error — try returning stale cache
    }

    if (freshData) {
      this.cachedTariffs = freshData
      this.lastFetch = now
      return freshData
    }
    if (this.cachedTariffs) return this.cachedTariffs
    throw Boom.badGateway(ERROR_MESSAGE.TARIFF.FETCH_ERROR).output
  }

  private async fetchYearReadings (supplyId: string, user: string): Promise<SupplyReadingDocument[]> {
    const lastReading = await SupplyReadingModel.findOne({ supplyId, user }).sort({ endDate: -1 })
    if (!lastReading) {
      throw Boom.badRequest(ERROR_MESSAGE.SUPPLY_READING.NO_READINGS_FOR_COMPARISON).output
    }

    const readings = await SupplyReadingModel.find({
      supplyId,
      user,
      endDate: { $lte: lastReading.endDate },
      startDate: { $gte: lastReading.endDate - ONE_YEAR_MS }
    })

    if (readings.length === 0) {
      throw Boom.badRequest(ERROR_MESSAGE.SUPPLY_READING.NO_READINGS_IN_LAST_YEAR).output
    }

    return readings
  }

  private calculateInvoiceCost (
    reading: Pick<ISupplyReading, 'consumptionPeak' | 'consumptionFlat' | 'consumptionOffPeak'>,
    contractedPowerPeak: number,
    contractedPowerOffPeak: number,
    prices: ITariffPrices,
    billedDays: number,
    taxes: ITaxConfig
  ): number {
    const powerCost =
      ((contractedPowerPeak * prices.peakPower) + (contractedPowerOffPeak * prices.offPeakPower)) * billedDays
    const energyCost =
      ((reading.consumptionPeak || 0) * prices.peakEnergy) +
      ((reading.consumptionFlat || 0) * prices.flatEnergy) +
      ((reading.consumptionOffPeak || 0) * prices.offPeakEnergy)
    const subtotal = (powerCost + energyCost) * (1 + taxes.electricityTax)
    return (subtotal + (taxes.meterRental * billedDays)) * (1 + taxes.vat)
  }

  private simulateTariff (
    tariff: ITariffEntry,
    readings: SupplyReadingDocument[],
    contractedPowerPeak: number,
    contractedPowerOffPeak: number,
    currentTariffPrices: ITariffPrices,
    taxes: ITaxConfig
  ): TariffComparisonResult {
    const { peakPower, offPeakPower, peakEnergy, flatEnergy, offPeakEnergy } = tariff.prices
    const newTariffPrices: ITariffPrices = { peakPower, offPeakPower, peakEnergy, flatEnergy, offPeakEnergy }

    const invoices: ISimulatedInvoice[] = readings.map(reading => {
      const billedDays = (reading.endDate - reading.startDate) / (1000 * 60 * 60 * 24)
      return {
        startDate: reading.startDate,
        endDate: reading.endDate,
        realAmount: reading.amount,
        currentTariffSimulatedAmount: Number(
          this.calculateInvoiceCost(reading, contractedPowerPeak, contractedPowerOffPeak, currentTariffPrices, billedDays, taxes).toFixed(2)
        ),
        newTariffSimulatedAmount: Number(
          this.calculateInvoiceCost(reading, contractedPowerPeak, contractedPowerOffPeak, newTariffPrices, billedDays, taxes).toFixed(2)
        )
      }
    })

    const estimatedAnnualTotal = Number(invoices.reduce((total, invoice) => total + invoice.newTariffSimulatedAmount, 0).toFixed(2))
    const currentTotalSimulated = invoices.reduce((total, invoice) => total + invoice.currentTariffSimulatedAmount, 0)

    return {
      retailer: tariff.retailer,
      tariffName: tariff.tariffName,
      peakPower,
      offPeakPower,
      peakEnergy,
      flatEnergy,
      offPeakEnergy,
      estimatedAnnualTotal,
      estimatedAnnualSavings: Number((currentTotalSimulated - estimatedAnnualTotal).toFixed(2)),
      invoices
    }
  }

  public async compareTariffs (supplyId: string, user: string): Promise<TariffComparisonResult[]> {
    const supply = await SupplyModel.findOne({ _id: supplyId, user })
    if (!supply) throw Boom.notFound(ERROR_MESSAGE.SUPPLY.NOT_FOUND).output

    const [readings, tariffData] = await Promise.all([
      this.fetchYearReadings(supplyId, user),
      this.fetchTariffs()
    ])

    const { taxes } = tariffData
    const currentTariffPrices: ITariffPrices = {
      peakPower: supply.currentPricePowerPeak!,
      offPeakPower: supply.currentPricePowerOffPeak!,
      peakEnergy: supply.currentPriceEnergyPeak!,
      flatEnergy: supply.currentPriceEnergyFlat!,
      offPeakEnergy: supply.currentPriceEnergyOffPeak!
    }

    return tariffData.tariffs
      .map(tariff => this.simulateTariff(
        tariff, readings,
        supply.contractedPowerPeak!, supply.contractedPowerOffPeak!,
        currentTariffPrices, taxes
      ))
      .toSorted((first, second) => second.estimatedAnnualSavings - first.estimatedAnnualSavings)
  }
}
