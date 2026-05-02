import { Typography } from '@mui/material'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import MainCard from 'components/MainCard'
import { type Account } from 'types'
import { PieTooltip } from '../chartTooltips'
import { hoverCardSx } from '../shared'

interface AccountsPieChartProps {
  accounts: Account[]
  chartColors: string[]
  isMobile: boolean
}

const AccountsPieChart = ({ accounts, chartColors, isMobile }: AccountsPieChartProps) => {
  const pieData = (accounts || [])
    .filter(a => a.balance > 0)
    .map(a => ({ name: a.name, value: a.balance }))

  const pieHeight = isMobile ? 200 : 240

  return (
    <MainCard title='Distribución por cuentas' sx={hoverCardSx}>
      {pieData.length > 0
        ? (
          <ResponsiveContainer width='100%' height={pieHeight}>
            <PieChart>
              <Pie
                data={pieData}
                cx='50%'
                cy='50%'
                innerRadius={isMobile ? 45 : 50}
                outerRadius={isMobile ? 70 : 80}
                paddingAngle={3}
                dataKey='value'
                animationDuration={800}
                animationBegin={400}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={chartColors[i % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value) => (
                  <Typography component='span' variant='body2'>{value}</Typography>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          )
        : (
          <Typography variant='body1' color='textSecondary'>Sin cuentas con saldo positivo</Typography>
          )}
    </MainCard>
  )
}

export default AccountsPieChart
