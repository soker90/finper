export const TARIFF_ROW_LABELS = {
  retailer: 'Comercializadora',
  tariffName: 'Nombre de Tarifa',
  powers: 'Potencias (Punta/Valle)',
  energies: 'Energías (Punta/Llana/Valle)',
  savingsPerYear: '/año',
  projectionTitle: 'Análisis de Proyección (Triple Comparativa)',
  period: 'Periodo',
  bankPayment: 'Pagado Banco',
  currentTariffCost: 'Coste Hoy (Tu Tarifa)',
  newTariffCost: 'Coste Hoy (Nueva Tarifa)',
  savings: 'Ahorro',
  saving: 'Ahorro',
  cost: 'Coste'
}

export interface TableColumn {
  id: string
  label: string
  align: 'left' | 'center' | 'right'
}

export const INVOICE_TABLE_COLUMNS: TableColumn[] = [
  { id: 'period', label: TARIFF_ROW_LABELS.period, align: 'left' },
  { id: 'realAmount', label: TARIFF_ROW_LABELS.bankPayment, align: 'right' },
  { id: 'currentTariffSimulatedAmount', label: TARIFF_ROW_LABELS.currentTariffCost, align: 'right' },
  { id: 'newTariffSimulatedAmount', label: TARIFF_ROW_LABELS.newTariffCost, align: 'right' },
  { id: 'savings', label: TARIFF_ROW_LABELS.savings, align: 'right' }
]
