import { Grid, Grow, Stack, Typography, Box } from '@mui/material'
import { ShopOutlined } from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { useTheme } from '@mui/material/styles'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { hoverCardSx } from '../shared'

interface TopStoresChartProps {
  items: Array<{ name: string; amount: number }>
  growTimeout?: number
}

const StoreTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        minWidth: 140
      }}
    >
      <Typography variant='body2' fontWeight={600}>{entry.payload.name}</Typography>
      <Typography variant='body1' fontWeight={700} color='primary'>
        {format.euro(Number(entry.value))}
      </Typography>
    </Box>
  )
}

const TopStoresChart = ({ items, growTimeout = 1350 }: TopStoresChartProps) => {
  const theme = useTheme()

  // Limit to top 8 stores to avoid chart overflow
  const data = items.slice(0, 8)
  const max = data[0]?.amount ?? 1

  return (
    <Grow in timeout={growTimeout}>
      <Grid size={{ xs: 12, md: 6 }}>
        <MainCard
          title='Top tiendas'
          sx={hoverCardSx}
          secondary={
            <Stack direction='row' alignItems='center' gap={0.5}>
              <ShopOutlined style={{ fontSize: 14 }} />
              <Typography variant='body2' color='textSecondary'>Este mes</Typography>
            </Stack>
          }
        >
          {data.length === 0
            ? (
              <Typography variant='body1' color='textSecondary'>
                No hay tiendas registradas este mes
              </Typography>
              )
            : (
              <ResponsiveContainer width='100%' height={Math.max(data.length * 40, 200)}>
                <BarChart
                  data={data}
                  layout='vertical'
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <XAxis
                    type='number'
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => format.euro(v)}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, max]}
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    width={110}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<StoreTooltip />} cursor={{ fill: theme.palette.action.hover }} />
                  <Bar dataKey='amount' radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {data.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index === 0
                          ? theme.palette.primary.main
                          : theme.palette.primary.light}
                        fillOpacity={1 - index * 0.07}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
        </MainCard>
      </Grid>
    </Grow>
  )
}

export default TopStoresChart
