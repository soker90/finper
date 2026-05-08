import { useNavigate } from 'react-router'
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TagSummary } from 'types'
import { format } from 'utils'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#A52A2A']

const tooltipFormatter = (value: unknown) => format.euro(Number(value))

const TrackingCard = ({ tagStat }: { tagStat: TagSummary }) => {
  const navigate = useNavigate()

  return (
    <Card
      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
      onClick={() => navigate(`/seguimientos/${tagStat.tag}`)}
    >
      <CardContent>
        <Stack spacing={1}>
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Typography variant='h5'>{tagStat.tag}</Typography>
            <Chip label={`${tagStat.transactionCount} mov.`} size='small' />
          </Stack>
          <Typography variant='h4' color='error.main'>
            {format.euro(tagStat.totalAmount)}
          </Typography>
          {tagStat.byCategory.length > 0 && (
            <ResponsiveContainer width='100%' height={200}>
              <PieChart>
                <Pie
                  data={tagStat.byCategory}
                  dataKey='amount'
                  nameKey='categoryName'
                  cx='50%'
                  cy='50%'
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {tagStat.byCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {tagStat.byCategory.length > 0 && (
            <Stack spacing={0.5}>
              {tagStat.byCategory.slice(0, 4).map((cat, index) => (
                <Stack key={cat.categoryId} direction='row' justifyContent='space-between' alignItems='center'>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Chip
                      size='small'
                      sx={{ bgcolor: COLORS[index % COLORS.length], width: 12, height: 12, borderRadius: '50%' }}
                    />
                    <Typography variant='body2'>{cat.categoryName}</Typography>
                  </Stack>
                  <Typography variant='body2' color='text.secondary'>
                    {format.euro(cat.amount)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default TrackingCard
