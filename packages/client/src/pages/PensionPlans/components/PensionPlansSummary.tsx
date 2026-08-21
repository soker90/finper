import React from 'react'
import { Grid } from '@mui/material'
import { FundOutlined, WalletOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import KpiCard from '../../Dashboard/components/KpiCard'
import { format } from 'utils'

interface PensionPlansSummaryProps {
  totalPlans: number
  totalContributed: number
  totalValue: number
}

export const PensionPlansSummary: React.FC<PensionPlansSummaryProps> = ({ totalPlans, totalContributed, totalValue }) => {
  const returnPct = totalContributed > 0 ? ((totalValue - totalContributed) / totalContributed) * 100 : null

  return (
    <Grid container spacing={3} sx={{ mb: 3, mt: 1 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title='Planes Activos'
          value={String(totalPlans)}
          subtitle='En seguimiento'
          icon={<FundOutlined />}
          color='primary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title='Total Aportado'
          value={format.euro(totalContributed)}
          subtitle='Suma de todos los planes'
          icon={<WalletOutlined />}
          color='secondary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title='Valor Total Actual'
          value={format.euro(totalValue)}
          subtitle='Valor conjunto de los planes'
          icon={<RiseOutlined />}
          color='success'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <KpiCard
          title='Rentabilidad'
          value={returnPct === null ? '—' : `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%`}
          subtitle='Conjunto de todos los planes'
          icon={returnPct !== null && returnPct < 0 ? <FallOutlined /> : <RiseOutlined />}
          color={returnPct !== null && returnPct < 0 ? 'error' : 'success'}
        />
      </Grid>
    </Grid>
  )
}
