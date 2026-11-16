export interface ISupplyReading {
  startDate: number
  endDate: number
  consumptionPeak: number | null
  consumptionFlat: number | null
  consumptionOffPeak: number | null
  amount: number
}
import { supplyRepository } from './supply.repository'
import { supplyReadingRepository } from '../supply-reading/supply-reading.repository'
import Boom from '@hapi/boom'
import { roundMoney } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import config from '../../config'

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

// ── External API types (Spanish field names match the remote JSON) ─────────────

interface ITariffApiResponse {
  datosGenerales: {
    iva: number
    impuestoElectrico: number
    alquilerContador: number
    bonoSocial: number
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
      mantenimientoPrecio?: number | null
      incluyeBonoSocial?: boolean
      descuento?: {
        tipo: 'porcentaje' | 'fijo'
        valor: number
        meses: number | null
        soloNuevosClientes?: boolean
      } | null
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
  socialBonusPerDay: number
}

interface IDiscount {
  tipo: 'porcentaje' | 'fijo'
  valor: number
  meses: number | null
  soloNuevosClientes: boolean
}

interface ITariffEntry {
  retailer: string
  tariffName: string
  priceGuaranteeMonths: number | null
  prices: ITariffPrices
  includesSocialBonus: boolean
  discount: IDiscount | null
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
  priceGuaranteeMonths: number | null
  discount: {
    tipo: 'porcentaje' | 'fijo'
    valor: number
    meses: number | null
    soloNuevosClientes: boolean
  } | null
  peakPower: number
  offPeakPower: number
  peakEnergy: number
  flatEnergy: number
  offPeakEnergy: number
  estimatedAnnualTotal: number
  estimatedAnnualSavings: number
  firstYearTotal: number | null
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
        meterRental: apiData.datosGenerales.alquilerContador,
        socialBonusPerDay: apiData.datosGenerales.bonoSocial ?? 0
      },
      tariffs: apiData.tarifas.map(entry => {
        const includesSocialBonus = entry.detalles.incluyeBonoSocial !== false

        return {
          retailer: entry.comercializadora,
          tariffName: entry.detalles.nombreTarifa,
          priceGuaranteeMonths: entry.detalles.mantenimientoPrecio ?? null,
          prices: {
            peakPower: entry.detalles.potenciaPunta,
            offPeakPower: entry.detalles.potenciaValle,
            peakEnergy: entry.detalles.energiaPunta,
            flatEnergy: entry.detalles.energiaLlana,
            offPeakEnergy: entry.detalles.energiaValle
          },
          includesSocialBonus,
          discount: entry.detalles.descuento
            ? { ...entry.detalles.descuento, soloNuevosClientes: entry.detalles.descuento.soloNuevosClientes ?? false }
            : null
        }
      })
    }
  }

  private async fetchTariffs (): Promise<ITariffData> {
    const now = Date.now()
    if (this.cachedTariffs && (now - this.lastFetch < config.tariffs.cacheDurationMs)) {
      return this.cachedTariffs
    }

    let freshData: ITariffData | null = null
    try {
      const response = await fetch(config.tariffs.apiUrl)
      if (response.ok) {
        const apiData = await response.json() as ITariffApiResponse
        freshData = this.mapApiResponse(apiData)
      }
    } catch {
      /* v8 ignore next — network errors not reproducible in unit tests */
    }

    if (freshData) {
      this.cachedTariffs = freshData
      this.lastFetch = now
      return freshData
    }
    /* v8 ignore next — stale cache fallback when fetch fails: not reproducible in tests */
    if (this.cachedTariffs) return this.cachedTariffs
    /* v8 ignore next — bad gateway only when fetch fails AND cache is empty */
    throw Boom.badGateway(ERROR_MESSAGE.TARIFF.FETCH_ERROR).output
  }

  private async fetchYearReadings (supplyId: string, user: string): Promise<ISupplyReading[]> {
    const lastReading = supplyReadingRepository.findLastBySupply(supplyId, user)
    if (!lastReading) {
      throw Boom.badRequest(ERROR_MESSAGE.SUPPLY_READING.NO_READINGS_FOR_COMPARISON).output
    }

    const to = lastReading.endDate
    const from = lastReading.endDate - ONE_YEAR_MS
    const rows = supplyReadingRepository.findInLastYear(supplyId, user, to, from)

    if (rows.length === 0) {
      throw Boom.badRequest(ERROR_MESSAGE.SUPPLY_READING.NO_READINGS_IN_LAST_YEAR).output
    }

    // El cálculo aguas abajo espera startDate/endDate como número (ms), como el doc Mongo viejo.
    return rows.map(r => ({
      ...r,
      startDate: r.startDate,
      endDate: r.endDate
    })) as unknown as ISupplyReading[]
  }

  private calculateInvoiceCost (
    reading: Pick<ISupplyReading, 'consumptionPeak' | 'consumptionFlat' | 'consumptionOffPeak'>,
    contractedPowerPeak: number,
    contractedPowerOffPeak: number,
    prices: ITariffPrices,
    billedDays: number,
    taxes: ITaxConfig,
    includesSocialBonus: boolean
  ): number {
    const powerCost =
      ((contractedPowerPeak * prices.peakPower) + (contractedPowerOffPeak * prices.offPeakPower)) * billedDays
    const energyCost =
      /* v8 ignore next */
      ((reading.consumptionPeak || 0) * prices.peakEnergy) +
      ((reading.consumptionFlat || 0) * prices.flatEnergy) +
      ((reading.consumptionOffPeak || 0) * prices.offPeakEnergy)
    // Impuesto Eléctrico: MAX(totalKWh × 0.001, (potencia + energía) × IEact)
    /* v8 ignore next */
    const totalKwh = (reading.consumptionPeak || 0) + (reading.consumptionFlat || 0) + (reading.consumptionOffPeak || 0)
    const electricityTaxAmount = Math.max(totalKwh * 0.001, (powerCost + energyCost) * taxes.electricityTax)
    const socialBonusAmount = includesSocialBonus ? taxes.socialBonusPerDay * billedDays : 0
    // TotalBruto = potencia + energía + impEléctrico + alquilerContador [+ bonoSocial]
    const totalBruto = powerCost + energyCost + electricityTaxAmount + (taxes.meterRental * billedDays) + socialBonusAmount
    return totalBruto * (1 + taxes.vat)
  }

  private hasFullYearCoverage (readings: ISupplyReading[], from: number, to: number): boolean {
    const sorted = [...readings].toSorted((a, b) => a.startDate - b.startDate)
    let coveredUntil = from

    for (const reading of sorted) {
      if (reading.endDate <= coveredUntil) continue
      if (reading.startDate > coveredUntil) return false
      coveredUntil = Math.max(coveredUntil, reading.endDate)
      if (coveredUntil >= to) return true
    }

    return false
  }

  private calculateWindowTotal (
    invoices: ISimulatedInvoice[],
    from: number,
    to: number,
    amount: (invoice: ISimulatedInvoice) => number
  ): number {
    return invoices.reduce((total, invoice) => {
      const invoiceDays = invoice.endDate - invoice.startDate
      if (invoiceDays <= 0) return total

      const overlap = Math.max(0, Math.min(invoice.endDate, to) - Math.max(invoice.startDate, from))
      return total + (amount(invoice) * overlap / invoiceDays)
    }, 0)
  }

  private simulateTariff (
    tariff: ITariffEntry,
    readings: ISupplyReading[],
    contractedPowerPeak: number,
    contractedPowerOffPeak: number,
    currentTariffPrices: ITariffPrices,
    taxes: ITaxConfig
  ): TariffComparisonResult {
    const { peakPower, offPeakPower, peakEnergy, flatEnergy, offPeakEnergy } = tariff.prices
    const newTariffPrices: ITariffPrices = { peakPower, offPeakPower, peakEnergy, flatEnergy, offPeakEnergy }

    const invoices: ISimulatedInvoice[] = readings.map(reading => {
      const billedDays = Math.max(1, roundMoney((reading.endDate - reading.startDate) / (1000 * 60 * 60 * 24)))
      return {
        startDate: reading.startDate,
        endDate: reading.endDate,
        realAmount: reading.amount,
        currentTariffSimulatedAmount: Number(
          this.calculateInvoiceCost(reading, contractedPowerPeak, contractedPowerOffPeak, currentTariffPrices, billedDays, taxes, tariff.includesSocialBonus).toFixed(2)
        ),
        newTariffSimulatedAmount: Number(
          this.calculateInvoiceCost(reading, contractedPowerPeak, contractedPowerOffPeak, newTariffPrices, billedDays, taxes, tariff.includesSocialBonus).toFixed(2)
        )
      }
    })

    const periodEnd = Math.max(...readings.map(reading => reading.endDate))
    const periodStart = periodEnd - ONE_YEAR_MS
    const hasFullYearCoverage = this.hasFullYearCoverage(readings, periodStart, periodEnd)
    const estimatedAnnualTotal = Number(
      this.calculateWindowTotal(invoices, periodStart, periodEnd, invoice => invoice.newTariffSimulatedAmount).toFixed(2)
    )
    const currentTotalSimulated = this.calculateWindowTotal(
      invoices, periodStart, periodEnd, invoice => invoice.currentTariffSimulatedAmount
    )

    // meses === null significa duración desconocida: no se puede estimar el descuento.
    // Los descuentos fijos se expresan en euros por mes promocionado.
    let firstYearTotal: number | null = null
    const { discount } = tariff
    if (discount && discount.meses !== null && hasFullYearCoverage) {
      const mesesPrimerAno = Math.min(discount.meses, 12)
      if (discount.tipo === 'porcentaje') {
        const descuentoEuros = estimatedAnnualTotal * (mesesPrimerAno / 12) * (discount.valor / 100)
        firstYearTotal = Number((estimatedAnnualTotal - descuentoEuros).toFixed(2))
      } else {
        firstYearTotal = Number((estimatedAnnualTotal - discount.valor * mesesPrimerAno).toFixed(2))
      }
    }

    return {
      retailer: tariff.retailer,
      tariffName: tariff.tariffName,
      priceGuaranteeMonths: tariff.priceGuaranteeMonths,
      discount: tariff.discount,
      peakPower,
      offPeakPower,
      peakEnergy,
      flatEnergy,
      offPeakEnergy,
      estimatedAnnualTotal,
      estimatedAnnualSavings: Number((currentTotalSimulated - estimatedAnnualTotal).toFixed(2)),
      firstYearTotal,
      invoices
    }
  }

  public async compareTariffs (supplyId: string, user: string): Promise<TariffComparisonResult[]> {
    const supply = supplyRepository.findById(supplyId, user)
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
      .toSorted(/* v8 ignore next */(first, second) => second.estimatedAnnualSavings - first.estimatedAnnualSavings)
  }
}
