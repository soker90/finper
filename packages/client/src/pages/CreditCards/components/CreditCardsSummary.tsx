import React from 'react'
import { Grid } from '@mui/material'
import { CreditCardOutlined, DollarOutlined, AuditOutlined } from '@ant-design/icons'
import KpiCard from '../../Dashboard/components/KpiCard'
import { format } from 'utils'

interface CreditCardsSummaryProps {
  totalDebt: number
  totalCards: number
  availableCredit: number
}

export const CreditCardsSummary: React.FC<CreditCardsSummaryProps> = ({ totalDebt, totalCards, availableCredit }) => (
  <Grid container spacing={3} sx={{ mb: 3, mt: 1 }}>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard
        title='Deuda Total Acumulada'
        value={format.euro(totalDebt)}
        subtitle='Suma de deudas de tarjetas'
        icon={<DollarOutlined />}
        color='error'
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard
        title='Tarjetas Activas'
        value={String(totalCards)}
        subtitle='En seguimiento'
        icon={<CreditCardOutlined />}
        color='primary'
      />
    </Grid>
    <Grid size={{ xs: 12, sm: 4 }}>
      <KpiCard
        title='Crédito Disponible Total'
        value={format.euro(availableCredit)}
        subtitle='Límite restante disponible'
        icon={<AuditOutlined />}
        color='success'
      />
    </Grid>
  </Grid>
)
