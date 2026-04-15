import { SupplyModel, SupplyReadingModel, SupplyReadingDocument, ISupplyReading } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

const TARIFFS_URL = 'https://soker90.github.io/tarifas-luz/tarifas.json'
const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 horas
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

// ── Tipos internos ────────────────────────────────────────────────────────────

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

interface ITaxConfig {
  iva: number
  impuestoElectrico: number
  alquilerContador: number
}

// ── Tipos públicos (usados en la interfaz del servicio) ───────────────────────

interface ISimulatedInvoice {
  startDate: number
  endDate: number
  realAmount: number
  currentTariffSimulatedAmount: number
  newTariffSimulatedAmount: number
}

export interface TariffComparisonResult {
  comercializadora: string
  nombreTarifa: string
  potenciaPunta: number
  potenciaValle: number
  energiaPunta: number
  energiaLlana: number
  energiaValle: number
  totalAnualEstimado: number
  ahorroAnualEstimado: number
  invoices: ISimulatedInvoice[]
}

export interface ITariffsService {
  compareTariffs(supplyId: string, user: string): Promise<TariffComparisonResult[]>
}

// ── Implementación ────────────────────────────────────────────────────────────

export default class TariffsService implements ITariffsService {
  private cachedTariffs: ITariffData | null = null
  private lastFetch: number = 0

  private async fetchTariffs (): Promise<ITariffData> {
    const now = Date.now()
    if (this.cachedTariffs && (now - this.lastFetch < CACHE_DURATION)) {
      return this.cachedTariffs
    }

    let freshData: ITariffData | null = null
    try {
      const response = await fetch(TARIFFS_URL)
      if (response.ok) {
        freshData = await response.json() as ITariffData
      }
    } catch {
      // error de red — se intenta devolver la caché obsoleta
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
    diasFacturados: number,
    taxes: ITaxConfig
  ): number {
    const costePotencia =
      ((contractedPowerPeak * prices.potenciaPunta) + (contractedPowerOffPeak * prices.potenciaValle)) * diasFacturados
    const costeEnergia =
      ((reading.consumptionPeak || 0) * prices.energiaPunta) +
      ((reading.consumptionFlat || 0) * prices.energiaLlana) +
      ((reading.consumptionOffPeak || 0) * prices.energiaValle)
    const subtotal = (costePotencia + costeEnergia) * (1 + taxes.impuestoElectrico)
    return (subtotal + (taxes.alquilerContador * diasFacturados)) * (1 + taxes.iva)
  }

  private simulateTariff (
    tariff: ITariffData['tarifas'][0],
    readings: SupplyReadingDocument[],
    contractedPowerPeak: number,
    contractedPowerOffPeak: number,
    currentTariffPrices: ITariffPrices,
    taxes: ITaxConfig
  ): TariffComparisonResult {
    const { potenciaPunta, potenciaValle, energiaPunta, energiaLlana, energiaValle } = tariff.detalles
    const newTariffPrices: ITariffPrices = { potenciaPunta, potenciaValle, energiaPunta, energiaLlana, energiaValle }

    const invoices: ISimulatedInvoice[] = readings.map(r => {
      const diasFacturados = (r.endDate - r.startDate) / (1000 * 60 * 60 * 24)
      return {
        startDate: r.startDate,
        endDate: r.endDate,
        realAmount: r.amount,
        currentTariffSimulatedAmount: Number(
          this.calculateInvoiceCost(r, contractedPowerPeak, contractedPowerOffPeak, currentTariffPrices, diasFacturados, taxes).toFixed(2)
        ),
        newTariffSimulatedAmount: Number(
          this.calculateInvoiceCost(r, contractedPowerPeak, contractedPowerOffPeak, newTariffPrices, diasFacturados, taxes).toFixed(2)
        )
      }
    })

    const totalAnualEstimado = Number(invoices.reduce((acc, inv) => acc + inv.newTariffSimulatedAmount, 0).toFixed(2))
    const currentTotalSimulated = invoices.reduce((acc, inv) => acc + inv.currentTariffSimulatedAmount, 0)

    return {
      comercializadora: tariff.comercializadora,
      nombreTarifa: tariff.detalles.nombreTarifa,
      potenciaPunta,
      potenciaValle,
      energiaPunta,
      energiaLlana,
      energiaValle,
      totalAnualEstimado,
      ahorroAnualEstimado: Number((currentTotalSimulated - totalAnualEstimado).toFixed(2)),
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

    const taxes: ITaxConfig = tariffData.datosGenerales
    const currentTariffPrices: ITariffPrices = {
      potenciaPunta: supply.currentPricePowerPeak!,
      potenciaValle: supply.currentPricePowerOffPeak!,
      energiaPunta: supply.currentPriceEnergyPeak!,
      energiaLlana: supply.currentPriceEnergyFlat!,
      energiaValle: supply.currentPriceEnergyOffPeak!
    }

    return tariffData.tarifas
      .map(t => this.simulateTariff(
        t, readings,
        supply.contractedPowerPeak!, supply.contractedPowerOffPeak!,
        currentTariffPrices, taxes
      ))
      .toSorted((a, b) => b.ahorroAnualEstimado - a.ahorroAnualEstimado)
  }
}
