import { type DashboardStats } from 'hooks'
import SectionTitle from '../SectionTitle'
import TopCategoriesTreemap from './TopCategoriesTreemap'
import TopStoresChart from './TopStoresChart'

interface MonthAnalysisProps {
  stats: DashboardStats
  chartColors: string[]
}

const MonthAnalysis = ({ stats, chartColors }: MonthAnalysisProps) => (
  <>
    <SectionTitle>Análisis del mes</SectionTitle>

    <TopCategoriesTreemap
      items={stats.topExpenseCategories}
      chartColors={chartColors}
      growTimeout={1300}
    />

    <TopStoresChart
      items={stats.topStores}
      chartColors={chartColors}
      growTimeout={1350}
    />
  </>
)

export default MonthAnalysis
