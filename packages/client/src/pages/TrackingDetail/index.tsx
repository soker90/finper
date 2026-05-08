import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTagHistoric, useTagDetail } from 'hooks'
import { format } from 'utils'
import Loader from 'components/Loader'
import CategoryBreakdownTable from './components/CategoryBreakdownTable'
import TagTransactionList from './components/TagTransactionList'

const BAR_COLORS = ['#1976d2', '#2196f3', '#42a5f5', '#64b5f6', '#90caf9']

const tooltipFormatter = (value: unknown) => format.euro(Number(value))

const TrackingDetail = () => {
  const { tagName, year: yearParam } = useParams<{ tagName: string; year?: string }>()
  const navigate = useNavigate()

  // Convert route param year to number if present and valid
  const paramYearNumber = yearParam ? Number(yearParam) : null
  const routeYear = paramYearNumber && !Number.isNaN(paramYearNumber) ? paramYearNumber : null

  // local state to control showing historic below when on a year route
  const [showHistoric, setShowHistoric] = useState(false)

  const { tagHistoric, isLoading: historicLoading } = useTagHistoric(tagName || '')
  const { tagDetail, isLoading: detailLoading } = useTagDetail(tagName || '', routeYear)

  const isYearRoute = !!routeYear
  const isLoading = isYearRoute ? detailLoading : historicLoading

  return (
    <Stack spacing={3}>
      <Stack direction='row' spacing={2} alignItems='center'>
        <Typography variant='h4'>{tagName}</Typography>
      </Stack>

      <Stack direction='row' spacing={2} alignItems='center'>
        <Button startIcon={<ArrowLeftOutlined />} onClick={() => navigate('/seguimientos')} size='small'>
          Volver
        </Button>

        {isYearRoute && tagHistoric && tagHistoric.years.length > 1 && (
          <Button onClick={() => setShowHistoric(true)} variant='text' size='small'>
            Histórico completo
          </Button>
        )}
      </Stack>

      {isLoading && <Loader />}

      {!isLoading && !isYearRoute && tagHistoric && (
        <>
          <Stack direction='row' spacing={2} alignItems='baseline'>
            <Typography variant='h5' color='text.secondary'>
              Total acumulado: <Typography component='span' variant='h4' color='error.main'>{format.euro(tagHistoric.totalAmount)}</Typography>
            </Typography>
          </Stack>

          {tagHistoric.years.length > 0 && (
            <>
              <Box height={300}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={tagHistoric.years}
                    onClick={(data) => {
                      if (data?.activeLabel) {
                        // navigate to year route
                        navigate(`/seguimientos/${tagName}/${data.activeLabel}`)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <XAxis dataKey='year' />
                    <YAxis />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar dataKey='totalAmount' radius={[4, 4, 0, 0]}>
                      {tagHistoric.years.map((yearData, index) => (
                        <Cell key={yearData.year} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Grid container spacing={2}>
                {tagHistoric.years.map((yearData) => (
                  <Grid key={yearData.year} size={{ xs: 6, sm: 3 }}>
                    <Box
                      p={2}
                      border={1}
                      borderColor='divider'
                      borderRadius={1}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => navigate(`/seguimientos/${tagName}/${yearData.year}`)}
                    >
                      <Typography variant='h6'>{yearData.year}</Typography>
                      <Typography variant='h5' color='error.main'>{format.euro(yearData.totalAmount)}</Typography>
                      <Chip label={`${yearData.transactionCount} mov.`} size='small' />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}

      {/* When on a year route, show the detail for that year */}
      {!isLoading && isYearRoute && tagDetail && (
        <>
          <Stack direction='row' spacing={2} alignItems='baseline'>
            <Chip label={routeYear} color='primary' />
            <Typography variant='h5' color='text.secondary'>
              Total: <Typography component='span' variant='h4' color='error.main'>{format.euro(tagDetail.totalAmount)}</Typography>
            </Typography>
            <Chip label={`${tagDetail.transactionCount} movimientos`} />
          </Stack>

          <CategoryBreakdownTable categories={tagDetail.byCategory} totalAmount={tagDetail.totalAmount} />

          <TagTransactionList transactions={tagDetail.transactions} />

          {/* show historic below if user asked for it */}
          {showHistoric && tagHistoric && (
            <>
              <Stack direction='row' spacing={2} alignItems='baseline'>
                <Typography variant='h5' color='text.secondary'>
                  Total acumulado: <Typography component='span' variant='h4' color='error.main'>{format.euro(tagHistoric.totalAmount)}</Typography>
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                {tagHistoric.years.map((yearData) => (
                  <Grid key={yearData.year} size={{ xs: 6, sm: 3 }}>
                    <Box p={2} border={1} borderColor='divider' borderRadius={1}>
                      <Typography variant='h6'>{yearData.year}</Typography>
                      <Typography variant='h5' color='error.main'>{format.euro(yearData.totalAmount)}</Typography>
                      <Chip label={`${yearData.transactionCount} mov.`} size='small' />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}
    </Stack>
  )
}

export default TrackingDetail
