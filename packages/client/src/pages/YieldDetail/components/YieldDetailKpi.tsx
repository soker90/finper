import React from 'react'
import { Grid } from '@mui/material'
import { BankOutlined, RiseOutlined, PercentageOutlined, ReconciliationOutlined } from '@ant-design/icons'
import KpiCard from '../../../pages/Dashboard/components/KpiCard'
import { format } from 'utils'
import { YieldDetail } from 'types'

interface Props {
  yieldData: YieldDetail
  currentBalance: number
}

const YieldDetailKpi = ({ yieldData, currentBalance }: Props) => {
  const lastSettlement = yieldData.settlements[0]
  let lastSettlementValue = '—'
  let lastSettlementSubtitle = 'Sin liquidaciones'

  if (lastSettlement) {
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
        lastSettlementValue = lastSettlement.percentage !== null && lastSettlement.percentage !== undefined
          ? `${format.number(lastSettlement.percentage)}%`
          : '0%'
        lastSettlementSubtitle = '% devuelto en últ. liquidación'
      }
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title='Saldo actual cuenta'
          value={format.euro(currentBalance)}
          subtitle='Saldo de la cuenta vinculada'
          icon={<BankOutlined />}
          color='primary'
        />
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
          title='Última liquidación'
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
