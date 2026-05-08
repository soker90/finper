import { useParams } from 'react-router'
import { Stack } from '@mui/material'
import { useTagHistoric, useTagDetail } from 'hooks'
import Loader from 'components/Loader'
import TrackingDetailHeader from './components/TrackingDetailHeader'
import HistoricBarChart from './components/HistoricBarChart'
import YearGrid from './components/YearGrid'
import HistoricCollapsible from './components/HistoricCollapsible'
import CategoryBreakdownTable from './components/CategoryBreakdownTable'
import TagTransactionList from './components/TagTransactionList'

const TrackingDetail = () => {
  const { tagName, year: yearParam } = useParams<{ tagName: string; year?: string }>()

  const paramYearNumber = yearParam ? Number(yearParam) : null
  const routeYear = paramYearNumber && !Number.isNaN(paramYearNumber) ? paramYearNumber : null
  const isYearRoute = !!routeYear

  const { tagHistoric, isLoading: historicLoading } = useTagHistoric(tagName || '')
  const { tagDetail, isLoading: detailLoading } = useTagDetail(tagName || '', routeYear)

  const isLoading = isYearRoute ? detailLoading : historicLoading

  // Totals resolved once data is available (0 while loading — header hides them when loading)
  const historicTotal = tagHistoric?.totalAmount ?? 0
  const historicCount = tagHistoric?.years.reduce((sum, year) => sum + year.transactionCount, 0)
  const detailTotal = tagDetail?.totalAmount ?? 0
  const detailCount = tagDetail?.transactionCount

  return (
    <Stack spacing={3}>

      {/* Cabecera siempre visible: título + botón volver (incluso durante loading) */}
      <TrackingDetailHeader
        tagName={tagName || ''}
        year={routeYear ?? undefined}
        totalAmount={isYearRoute ? detailTotal : historicTotal}
        transactionCount={isYearRoute ? detailCount : historicCount}
        isHistoric={!isYearRoute}
        loading={isLoading}
      />

      {isLoading && <Loader />}

      {/* Vista histórica (sin año en la ruta) */}
      {!isLoading && !isYearRoute && tagHistoric && tagHistoric.years.length > 0 && (
        <>
          <HistoricBarChart tagName={tagName || ''} years={tagHistoric.years} height={280} />
          <YearGrid tagName={tagName || ''} years={tagHistoric.years} />
        </>
      )}

      {/* Vista de año concreto */}
      {!isLoading && isYearRoute && tagDetail && (
        <>
          <CategoryBreakdownTable
            categories={tagDetail.byCategory}
            totalAmount={tagDetail.totalAmount}
          />

          <TagTransactionList transactions={tagDetail.transactions} />

          {tagHistoric && tagHistoric.years.length > 1 && (
            <HistoricCollapsible tagName={tagName || ''} tagHistoric={tagHistoric} />
          )}
        </>
      )}

    </Stack>
  )
}

export default TrackingDetail
