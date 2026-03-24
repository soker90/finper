import React from 'react'
import { Grid, Grow } from '@mui/material'
import {
  WalletOutlined,
  SafetyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import { format } from 'utils'
import { type DashboardStats } from 'hooks'
import KpiCard from './KpiCard'
import SectionTitle from './SectionTitle'
import { trendChip } from '../utils/trendChip'

interface KpiSummaryProps {
  stats: DashboardStats
}

const KpiSummary = ({ stats }: KpiSummaryProps) => {
  const incomeTrend = trendChip(stats.monthlyTrend.income.current, stats.monthlyTrend.income.previous)
  const expensesTrend = trendChip(stats.monthlyTrend.expenses.current, stats.monthlyTrend.expenses.previous, true)

  return (
    <>
      <SectionTitle>Resumen</SectionTitle>

      <Grow in timeout={400}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Balance Total'
            value={format.euro(stats.totalBalance)}
            subtitle='Suma de todas las cuentas'
            icon={<WalletOutlined />}
            color='primary'
          />
        </Grid>
      </Grow>

      <Grow in timeout={500}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Patrimonio Neto'
            value={format.euro(stats.netWorth)}
            subtitle='Balance menos deudas'
            icon={<SafetyOutlined />}
            color='success'
          />
        </Grid>
      </Grow>

      <Grow in timeout={600}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Ingresos del Mes'
            value={format.euro(stats.monthlyIncome)}
            subtitle='Mes actual'
            icon={<ArrowUpOutlined />}
            trend={incomeTrend}
            color='success'
          />
        </Grid>
      </Grow>

      <Grow in timeout={700}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Gastos del Mes'
            value={format.euro(stats.monthlyExpenses)}
            subtitle='Mes actual'
            icon={<ArrowDownOutlined />}
            trend={expensesTrend}
            color='error'
          />
        </Grid>
      </Grow>
    </>
  )
}

export default KpiSummary
