import { Stack, Typography } from '@mui/material'
import { ShopOutlined } from '@ant-design/icons'
import { type DashboardStats } from 'hooks'
import SectionTitle from '../SectionTitle'
import DonutRankedCard from './DonutRankedCard'

interface MonthAnalysisProps {
  stats: DashboardStats
  chartColors: string[]
}

const MonthAnalysis = ({ stats, chartColors }: MonthAnalysisProps) => (
  <>
    <SectionTitle>Análisis del mes</SectionTitle>

    <DonutRankedCard
      title='Top gastos por categoría'
      modalTitle='Categorías — este mes'
      secondary={<Typography variant='body2' color='textSecondary'>Este mes</Typography>}
      items={stats.topExpenseCategories}
      chartColors={chartColors}
      colorOffset={0}
      emptyMessage='No hay gastos registrados este mes'
      growTimeout={1300}
    />

    <DonutRankedCard
      title='Top tiendas'
      modalTitle='Tiendas — este mes'
      secondary={
        <Stack direction='row' alignItems='center' gap={0.5}>
          <ShopOutlined style={{ fontSize: 14 }} />
          <Typography variant='body2' color='textSecondary'>Este mes</Typography>
        </Stack>
      }
      items={stats.topStores}
      chartColors={chartColors}
      colorOffset={2}
      emptyMessage='No hay tiendas registradas este mes'
      growTimeout={1350}
    />
  </>
)

export default MonthAnalysis
