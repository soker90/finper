import React from 'react'
import { Grid } from '@mui/material'
import { FundOutlined, WalletOutlined, RiseOutlined } from '@ant-design/icons'
import KpiCard from '../../Dashboard/components/KpiCard'
import { format } from 'utils'

interface PensionPlansSummaryProps {
  totalPlans: number
  totalContributed: number
  totalValue: number
}

export const PensionPlansSummary: React.FC<PensionPlansSummaryProps> = ({ totalPlans, totalContributed, totalValue }) => (
  <Grid container spacing={3} sx={{ mb: 3, mt: 1 }}>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard
        title='Planes Activos'
        value={String(totalPlans)}
        subtitle='En seguimiento'
        icon={<FundOutlined />}
        color='primary'
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard
        title='Total Aportado'
        value={format.euro(totalContributed)}
        subtitle='Suma de todos los planes'
        icon={<WalletOutlined />}
        color='secondary'
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard
        title='Valor Total Actual'
        value={format.euro(totalValue)}
        subtitle='Valor conjunto de los planes'
        icon={<RiseOutlined />}
        color='success'
      />
    </Grid>
  </Grid>
)
