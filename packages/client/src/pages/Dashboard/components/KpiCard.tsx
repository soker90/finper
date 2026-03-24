import { type ReactNode } from 'react'
import { Stack, Typography, Avatar } from '@mui/material'
import MainCard from 'components/MainCard'
import { hoverCardSx } from './shared'

export interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: ReactNode
  trend?: ReactNode
  color?: string
}

const KpiCard = ({ title, value, subtitle, icon, trend, color = 'primary' }: KpiCardProps) => (
  <MainCard contentSX={{ p: 2.25 }} sx={hoverCardSx}>
    <Stack spacing={0.5}>
      <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Typography variant='body1' color='textSecondary'>
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.main`, width: 36, height: 36 }}>
          {icon}
        </Avatar>
      </Stack>
      <Stack direction='row' alignItems='center'>
        <Typography variant='h4'>{value}</Typography>
        {trend}
      </Stack>
      <Typography variant='body2' color='textSecondary'>{subtitle}</Typography>
    </Stack>
  </MainCard>
)

export default KpiCard
