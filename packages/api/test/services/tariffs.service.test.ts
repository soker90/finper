import { SupplyModel, SupplyReadingModel, mongoose, SUPPLY_TYPE } from '@soker90/finper-models'
import TariffsService from '../../src/services/tariffs.service'
import { insertSupply, insertSupplyReading } from '../insert-data-to-model'
import { generateUsername } from '../generate-values'

const testDatabase = require('../test-db')(mongoose)

// Helpers compartidos
const FULL_PRICE_SUPPLY = {
  type: SUPPLY_TYPE.ELECTRICITY,
  contractedPowerPeak: 3.45,
  contractedPowerOffPeak: 3.45,
  currentPricePowerPeak: 0.104229,
  currentPricePowerOffPeak: 0.053479,
  currentPriceEnergyPeak: 0.157316,
  currentPriceEnergyFlat: 0.130024,
  currentPriceEnergyOffPeak: 0.090212
}

const BASE_TARIFF_DETALLES = {
  potenciaPunta: 0.1,
  potenciaValle: 0.05,
  periodos: 3,
  energiaPunta: 0.15,
  energiaLlana: 0.12,
  energiaValle: 0.08
}

const makeApiResponse = (descuento: any = null) => ({
  datosGenerales: { iva: 0.21, impuestoElectrico: 0.0511269632, alquilerContador: 0.026557 },
  tarifas: [{
    comercializadora: 'Test',
    detalles: { ...BASE_TARIFF_DETALLES, nombreTarifa: 'Test Tarifa', ...(descuento ? { descuento } : {}) }
  }]
})

// Estas ramas (discount.tipo === 'porcentaje' / 'fijo') no son alcanzables por ruta
// porque el TariffsService es un singleton con caché de 12 horas: los tests de ruta
// previos ya habrán cargado el caché con tarifas sin descuento.
describe('TariffsService.simulateTariff — ramas de descuento', () => {
  let user: string
  let supplyId: string

  beforeAll(() => testDatabase.connect())
  afterAll(() => testDatabase.close())
  afterEach(() => Promise.all([SupplyModel.deleteMany({}), SupplyReadingModel.deleteMany({})]))

  beforeEach(async () => {
    user = generateUsername()
    const supply = await insertSupply({ user, ...FULL_PRICE_SUPPLY })
    supplyId = supply._id.toString()
    const endDate = Date.now()
    await insertSupplyReading({
      user,
      supplyId,
      startDate: endDate - 30 * 24 * 60 * 60 * 1000,
      endDate
    })
  })

  test('discount tipo porcentaje: firstYearTotal is a number less than estimatedAnnualTotal', async () => {
    // Instancia FRESCA → sin caché → usará el mock de fetch
    const service = new TariffsService()
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse({ tipo: 'porcentaje', valor: 10, meses: 12, soloNuevosClientes: false })
    } as Response)

    const results = await service.compareTariffs(supplyId, user)

    expect(results).toHaveLength(1)
    expect(typeof results[0].firstYearTotal).toBe('number')
    expect(results[0].firstYearTotal!).toBeLessThan(results[0].estimatedAnnualTotal)
  })

  test('discount tipo porcentaje con meses limitados: firstYearTotal > estimatedAnnualTotal * 0.5', async () => {
    const service = new TariffsService()
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse({ tipo: 'porcentaje', valor: 10, meses: 6, soloNuevosClientes: false })
    } as Response)

    const results = await service.compareTariffs(supplyId, user)

    expect(typeof results[0].firstYearTotal).toBe('number')
  })

  test('discount tipo fijo: firstYearTotal is a number', async () => {
    const service = new TariffsService()
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse({ tipo: 'fijo', valor: 5, meses: 6 })
    } as Response)

    const results = await service.compareTariffs(supplyId, user)

    expect(results).toHaveLength(1)
    expect(typeof results[0].firstYearTotal).toBe('number')
  })

  test('discount tipo fijo con meses null (permanente): firstYearTotal calculado sobre 12 meses', async () => {
    const service = new TariffsService()
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse({ tipo: 'fijo', valor: 3, meses: null })
    } as Response)

    const results = await service.compareTariffs(supplyId, user)

    expect(typeof results[0].firstYearTotal).toBe('number')
  })

  test('no discount: firstYearTotal is null', async () => {
    const service = new TariffsService()
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(null)
    } as Response)

    const results = await service.compareTariffs(supplyId, user)

    expect(results[0].firstYearTotal).toBeNull()
  })
})
