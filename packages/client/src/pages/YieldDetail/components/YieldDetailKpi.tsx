import React from 'react'
import { Grid } from '@mui/material'
import { BankOutlined, RiseOutlined, PercentageOutlined, ReconciliationOutlined, ShoppingOutlined } from '@ant-design/icons'
import KpiCard from '../../../pages/Dashboard/components/KpiCard'
import { format } from 'utils'
import { YieldDetail, YieldSettlement } from 'types'

interface Props {
  yieldData: YieldDetail
  currentBalance: number
  viewMode?: 'settlement' | 'annual'
}

const getAnnualSummary = (yieldData: YieldDetail): { value: string, subtitle: string } => {
  const latestYearStats = yieldData.annualBreakdown![0]
  if (yieldData.type === 'interest') {
    const value = format.euro(latestYearStats.net ?? 0)
    const subtitle = latestYearStats.weightedTae !== null && latestYearStats.weightedTae !== undefined
      ? `Neto en ${latestYearStats.year} (${format.number(latestYearStats.weightedTae)}% TAE)`
      : `Neto en ${latestYearStats.year}`
    return { value, subtitle }
  }
  const value = latestYearStats.percentage !== null && latestYearStats.percentage !== undefined
    ? `${format.number(latestYearStats.percentage)}%`
    : '—'
  return { value, subtitle: `% devuelto en ${latestYearStats.year}` }
}

const getInterestSettlementSummary = (lastSettlement: YieldSettlement): { value: string, subtitle: string } => {
  const value = format.euro(lastSettlement.net ?? 0)
  const parts = []
  if (lastSettlement.tae !== null && lastSettlement.tae !== undefined) {
    const src = lastSettlement.taeSource === 'provided' ? 'introd.' : 'calc.'
    parts.push(`TAE: ${format.number(lastSettlement.tae)}% (${src})`)
  }
  if (lastSettlement.averageBalance !== null && lastSettlement.averageBalance !== undefined) {
    const src = lastSettlement.balanceSource === 'provided' ? 'introd.' : 'calc.'
    parts.push(`Saldo: ${format.euro(lastSettlement.averageBalance)} (${src})`)
  }
  return { value, subtitle: parts.length > 0 ? parts.join(' · ') : 'Sin datos TAE/Saldo' }
}

const getCashbackSettlementSummary = (lastSettlement: YieldSettlement): { value: string, subtitle: string } => {
  if (lastSettlement.status === 'pending') {
    return { value: 'Pendiente', subtitle: 'Pendiente de abono' }
  }
  const value = lastSettlement.percentage !== null && lastSettlement.percentage !== undefined
    ? `${format.number(lastSettlement.percentage)}%`
    : '—'
  return { value, subtitle: '% devuelto en últ. liquidación' }
}

/** KPI shown in the "Última liquidación" / "Resumen Año Reciente" card. */
const getLastSettlementSummary = ({ yieldData, viewMode, lastSettlement }: {
  yieldData: YieldDetail
  viewMode: 'settlement' | 'annual'
  lastSettlement?: YieldSettlement
}): { value: string, subtitle: string } => {
  if (viewMode === 'annual' && yieldData.annualBreakdown && yieldData.annualBreakdown.length > 0) {
    return getAnnualSummary(yieldData)
  }
  if (!lastSettlement) return { value: '—', subtitle: 'Sin liquidaciones' }

  return yieldData.type === 'interest'
    ? getInterestSettlementSummary(lastSettlement)
    : getCashbackSettlementSummary(lastSettlement)
}

/** Estimated monthly interest shown in the primary KPI card for interest yields. */
const getInterestEstimateSubtitle = (lastSettlement: YieldSettlement | undefined, currentBalance: number): string => {
  let monthlyRate: number | null = null
  let rateTae: number | null = null

  if (lastSettlement) {
    if (lastSettlement.tae !== null && lastSettlement.tae !== undefined && lastSettlement.tae > 0) {
      monthlyRate = Math.pow(1 + lastSettlement.tae / 100, 1 / 12) - 1
      rateTae = lastSettlement.tae
    } else if ((lastSettlement.net ?? 0) > 0 && (lastSettlement.averageBalance ?? 0) > 0) {
      monthlyRate = lastSettlement.net! / lastSettlement.averageBalance!
      if (1 + monthlyRate > 0) {
        rateTae = (Math.pow(1 + monthlyRate, 12) - 1) * 100
      }
    }
  }

  if (monthlyRate !== null && monthlyRate > 0 && rateTae !== null && rateTae > 0) {
    const estimatedInterest = currentBalance * monthlyRate
    return `Est. mensual: ${format.euro(estimatedInterest)} (~${format.number(rateTae)}% TAE)`
  }
  return 'Sin histórico para estimar interés'
}

/** Pending bills and estimated cashback shown in the primary KPI card for cashback yields. */
const getCashbackPendingSummary = (settlements: YieldSettlement[]): { pendingBills: number, subtitle: string } => {
  const pendingSettlements = settlements.filter((s) => s.status === 'pending')
  const pendingBills = pendingSettlements.reduce((sum, s) => sum + (s.billsTotal ?? 0), 0)

  if (pendingBills === 0) return { pendingBills, subtitle: 'Sin recibos pendientes' }

  const completedSettlements = settlements.filter((s) => s.status === 'completed' && (s.billsTotal ?? 0) > 0 && (s.cashbackAmount ?? 0) > 0)
  if (completedSettlements.length === 0) return { pendingBills, subtitle: 'Sin histórico para estimar cashback' }

  const totalCompletedBills = completedSettlements.reduce((sum, s) => sum + (s.billsTotal ?? 0), 0)
  const totalCompletedCashback = completedSettlements.reduce((sum, s) => sum + (s.cashbackAmount ?? 0), 0)
  if (totalCompletedBills === 0) return { pendingBills, subtitle: 'Sin histórico para estimar cashback' }

  const estimatedRate = totalCompletedCashback / totalCompletedBills
  const estimatedCashback = pendingBills * estimatedRate
  return { pendingBills, subtitle: `Estimado: ${format.euro(estimatedCashback)} (~${format.number(estimatedRate * 100)}%)` }
}

const YieldDetailKpi = ({ yieldData, currentBalance, viewMode = 'settlement' }: Props) => {
  const lastSettlement = yieldData.settlements.find((s) => s.status === 'completed' || s.settlementDate !== null) || yieldData.settlements[0]

  const { value: lastSettlementValue, subtitle: lastSettlementSubtitle } = getLastSettlementSummary({ yieldData, viewMode, lastSettlement })

  const isInterest = yieldData.type === 'interest'
  const interestSubtitle = isInterest ? getInterestEstimateSubtitle(lastSettlement, currentBalance) : ''
  const { pendingBills, subtitle: pendingBillsSubtitle } = isInterest
    ? { pendingBills: 0, subtitle: '' }
    : getCashbackPendingSummary(yieldData.settlements)

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        {isInterest
          ? (
            <KpiCard
              title='Saldo actual cuenta'
              value={format.euro(currentBalance)}
              subtitle={interestSubtitle}
              icon={<BankOutlined />}
              color='primary'
            />
            )
          : (
            <KpiCard
              title='Gasto pendiente'
              value={format.euro(pendingBills)}
              subtitle={pendingBillsSubtitle}
              icon={<ShoppingOutlined />}
              color='primary'
            />
            )}
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title='Neto acumulado'
          value={format.euro(yieldData.netAccumulated)}
          subtitle='Suma de todas las liquidaciones'
          icon={<RiseOutlined />}
          color='success'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title={viewMode === 'annual' ? 'Resumen Año Reciente' : 'Última liquidación'}
          value={lastSettlementValue}
          subtitle={lastSettlementSubtitle}
          icon={isInterest ? <RiseOutlined /> : <PercentageOutlined />}
          color='warning'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title='Movimientos enlazados'
          value={String(yieldData.entriesCount)}
          subtitle='Total de transacciones'
          icon={<ReconciliationOutlined />}
          color='info'
        />
      </Grid>
    </Grid>
  )
}

export default YieldDetailKpi
