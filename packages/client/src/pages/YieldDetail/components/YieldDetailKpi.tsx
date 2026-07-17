import React from 'react'
import { Grid } from '@mui/material'
import { BankOutlined, RiseOutlined, PercentageOutlined, ReconciliationOutlined, ShoppingOutlined } from '@ant-design/icons'
import KpiCard from '../../../pages/Dashboard/components/KpiCard'
import { format } from 'utils'
import { YieldDetail } from 'types'

interface Props {
  yieldData: YieldDetail
  currentBalance: number
  viewMode?: 'settlement' | 'annual'
}

const YieldDetailKpi = ({ yieldData, currentBalance, viewMode = 'settlement' }: Props) => {
  const lastSettlement = yieldData.settlements.find((s) => s.status === 'completed' || s.settlementDate !== null) || yieldData.settlements[0]
  let lastSettlementValue = '—'
  let lastSettlementSubtitle = 'Sin liquidaciones'

  if (viewMode === 'annual' && yieldData.annualBreakdown && yieldData.annualBreakdown.length > 0) {
    const latestYearStats = yieldData.annualBreakdown[0]
    if (yieldData.type === 'interest') {
      lastSettlementValue = format.euro(latestYearStats.net ?? 0)
      lastSettlementSubtitle = `Neto en ${latestYearStats.year}`
    } else {
      let annualRate = 0
      if ((latestYearStats.billsTotal ?? 0) > 0 && (latestYearStats.cashbackAmount ?? 0) > 0) {
        annualRate = (latestYearStats.cashbackAmount / latestYearStats.billsTotal) * 100
      } else {
        const yearSettlements = yieldData.settlements.filter(s => {
          const y = s.settlementDate ? new Date(s.settlementDate).getFullYear() : new Date().getFullYear()
          return y === latestYearStats.year && (s.percentage ?? 0) > 0
        })
        if (yearSettlements.length > 0) {
          annualRate = yearSettlements.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / yearSettlements.length
        }
      }
      lastSettlementValue = `${format.number(annualRate)}%`
      lastSettlementSubtitle = `% devuelto medio en ${latestYearStats.year}`
    }
  } else if (lastSettlement) {
    if (yieldData.type === 'interest') {
      lastSettlementValue = format.euro(lastSettlement.net ?? 0)
      const parts = []
      if (lastSettlement.tae !== null && lastSettlement.tae !== undefined) {
        const src = lastSettlement.taeSource === 'provided' ? 'introd.' : 'calc.'
        parts.push(`TAE: ${format.number(lastSettlement.tae)}% (${src})`)
      }
      if (lastSettlement.averageBalance !== null && lastSettlement.averageBalance !== undefined) {
        const src = lastSettlement.balanceSource === 'provided' ? 'introd.' : 'calc.'
        parts.push(`Saldo: ${format.euro(lastSettlement.averageBalance)} (${src})`)
      }
      lastSettlementSubtitle = parts.length > 0 ? parts.join(' · ') : 'Sin datos TAE/Saldo'
    } else {
      if (lastSettlement.status === 'pending') {
        lastSettlementValue = 'Pendiente'
        lastSettlementSubtitle = 'Pendiente de abono'
      } else {
        const netStr = lastSettlement.percentage !== null && lastSettlement.percentage !== undefined
          ? `${format.number(lastSettlement.percentage)}%`
          : '0%'
        const grossStr = lastSettlement.grossPercentage !== null && lastSettlement.grossPercentage !== undefined
          ? `${format.number(lastSettlement.grossPercentage)}%`
          : null
        lastSettlementValue = netStr
        lastSettlementSubtitle = grossStr
          ? `% devuelto neto (Bruto: ${grossStr})`
          : '% devuelto en últ. liquidación'
      }
    }
  }

  let pendingBills = 0
  let pendingBillsSubtitle = 'Sin recibos pendientes'
  if (yieldData.type === 'cashback') {
    const pendingSettlements = yieldData.settlements.filter((s) => s.status === 'pending')
    pendingBills = pendingSettlements.reduce((sum, s) => sum + (s.billsTotal ?? 0), 0)

    if (pendingBills > 0) {
      const completedSettlements = yieldData.settlements.filter((s) => s.status === 'completed' && (s.billsTotal ?? 0) > 0 && (s.cashbackAmount ?? 0) > 0)
      if (completedSettlements.length > 0) {
        const totalCompletedBills = completedSettlements.reduce((sum, s) => sum + (s.billsTotal ?? 0), 0)
        const totalCompletedCashback = completedSettlements.reduce((sum, s) => sum + (s.cashbackAmount ?? 0), 0)
        if (totalCompletedBills > 0) {
          const estimatedRate = totalCompletedCashback / totalCompletedBills
          const estimatedCashback = pendingBills * estimatedRate
          pendingBillsSubtitle = `Estimado: ${format.euro(estimatedCashback)} (~${format.number(estimatedRate * 100)}%)`
        } else {
          pendingBillsSubtitle = 'Sin histórico para estimar cashback'
        }
      } else {
        pendingBillsSubtitle = 'Sin histórico para estimar cashback'
      }
    }
  }

  let interestSubtitle = 'Saldo de la cuenta vinculada'
  if (yieldData.type === 'interest') {
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
      interestSubtitle = `Est. mensual: ${format.euro(estimatedInterest)} (~${format.number(rateTae)}% TAE)`
    } else {
      interestSubtitle = 'Sin histórico para estimar interés'
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        {yieldData.type === 'interest'
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
          icon={yieldData.type === 'interest' ? <RiseOutlined /> : <PercentageOutlined />}
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
