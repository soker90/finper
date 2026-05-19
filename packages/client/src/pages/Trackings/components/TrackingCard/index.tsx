import { useNavigate } from 'react-router'
import { Chip, Stack, Typography } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { MainCard } from 'components'
import { TagSummary } from 'types'
import { format } from 'utils'
import { hoverCardSx, useChartColors, ColorDot } from '../../../Dashboard/components/shared'

const tooltipFormatter = (value: unknown) => format.euro(Number(value))

const TrackingCard = ({ tagStat, year }: { tagStat: TagSummary; year?: number | null }) => {
  const navigate = useNavigate()
  const chartColors = useChartColors()

  const handleNavigateToDetail = () => {
    if (year) {
      navigate(`/seguimientos/${tagStat.tag}/${year}`)
    } else {
      navigate(`/seguimientos/${tagStat.tag}`)
    }
  }

  return (
    <MainCard
      contentSX={{ p: 2.25 }}
      sx={{ ...hoverCardSx, cursor: 'pointer' }}
      onClick={handleNavigateToDetail}
    >
      <Stack spacing={1.5}>
        {/* Header: nombre + conteo */}
        <Stack
          direction='row'
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography
            variant='h5' sx={{
              fontWeight: 600
            }}
          >{tagStat.tag}
          </Typography>
          <Chip label={`${tagStat.transactionCount} mov.`} size='small' variant='outlined' />
        </Stack>

        {/* Total */}
        <Typography
          variant='h4' sx={{
            color: 'text.primary'
          }}
        >
          {format.euro(tagStat.totalAmount)}
        </Typography>

        {/* Donut chart */}
        {tagStat.byCategory.length > 0 && (
          <ResponsiveContainer width='100%' height={180}>
            <PieChart>
              <Pie
                data={tagStat.byCategory}
                dataKey='amount'
                nameKey='categoryName'
                cx='50%'
                cy='50%'
                innerRadius={48}
                outerRadius={76}
                paddingAngle={2}
              >
                {tagStat.byCategory.map((_, index) => (
                  <Cell key={`cell-${tagStat.byCategory[index]?.categoryId ?? index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Leyenda de categorías */}
        {tagStat.byCategory.length > 0 && (
          <Stack spacing={0.75}>
            {tagStat.byCategory.slice(0, 4).map((cat, index) => (
              <Stack
                key={cat.categoryId}
                direction='row'
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Stack
                  direction='row' spacing={1} sx={{
                    alignItems: 'center'
                  }}
                >
                  <ColorDot color={chartColors[index % chartColors.length]} size={10} />
                  <Typography
                    variant='body2' sx={{
                      color: 'text.secondary'
                    }}
                  >{cat.categoryName}
                  </Typography>
                </Stack>
                <Typography
                  variant='body2' sx={{
                    fontWeight: 500
                  }}
                >
                  {format.euro(cat.amount)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </MainCard>
  )
}

export default TrackingCard
