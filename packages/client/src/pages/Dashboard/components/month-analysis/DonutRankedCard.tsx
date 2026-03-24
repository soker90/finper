import { useState, type ReactNode } from 'react'
import { Grid, Grow, Stack, Box, Typography, Button, LinearProgress } from '@mui/material'
import { UnorderedListOutlined } from '@ant-design/icons'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { PieTooltip } from '../chartTooltips'
import { hoverCardSx, ColorDot } from '../shared'
import { groupWithOthers, rotateColors, OTHERS_LABEL, OTHERS_COLOR, type RankedItem } from '../../utils/groupWithOthers'
import CategoryBreakdownModal from './CategoryBreakdownModal'

interface DonutRankedCardProps {
  title: string
  modalTitle: string
  secondary?: ReactNode
  items: RankedItem[]
  chartColors: string[]
  colorOffset?: number
  emptyMessage: string
  growTimeout: number
}

const DonutRankedCard = ({
  title,
  modalTitle,
  secondary,
  items,
  chartColors,
  colorOffset = 0,
  emptyMessage,
  growTimeout
}: DonutRankedCardProps) => {
  const [modalOpen, setModalOpen] = useState(false)

  const colors = rotateColors(chartColors, colorOffset)

  const grouped = groupWithOthers(items)
  const max = grouped[0]?.amount ?? 1

  const itemColor = (name: string, i: number) =>
    name === OTHERS_LABEL ? OTHERS_COLOR : colors[i % colors.length]

  return (
    <>
      <Grow in timeout={growTimeout}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MainCard
            title={title}
            sx={hoverCardSx}
            secondary={
              <Stack direction='row' alignItems='center' gap={1}>
                {secondary}
                <Button
                  size='small'
                  variant='text'
                  startIcon={<UnorderedListOutlined />}
                  onClick={() => setModalOpen(true)}
                  disabled={items.length === 0}
                >
                  Ver todo
                </Button>
              </Stack>
            }
          >
            {items.length === 0
              ? (
                <Typography variant='body1' color='textSecondary'>{emptyMessage}</Typography>
                )
              : (
                <Stack spacing={2}>
                  {/* Donut */}
                  <ResponsiveContainer width='100%' height={200}>
                    <PieChart>
                      <Pie
                        data={grouped}
                        cx='50%'
                        cy='50%'
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey='amount'
                        nameKey='name'
                        animationDuration={800}
                      >
                        {grouped.map((item, i) => (
                          <Cell key={item.name} fill={itemColor(item.name, i)} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Lista de barras */}
                  <Stack spacing={1.5}>
                    {grouped.map((item, i) => {
                      const color = itemColor(item.name, i)
                      return (
                        <Box key={item.name}>
                          <Stack direction='row' justifyContent='space-between' sx={{ mb: 0.5 }}>
                            <Stack direction='row' alignItems='center' gap={0.75}>
                              <ColorDot color={color} size={10} />
                              <Typography variant='body2'>{item.name}</Typography>
                            </Stack>
                            <Typography variant='body2' fontWeight={600}>
                              {format.euro(item.amount)}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant='determinate'
                            value={(item.amount / max) * 100}
                            sx={{
                              borderRadius: 1,
                              height: 5,
                              '& .MuiLinearProgress-bar': { bgcolor: color }
                            }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </Stack>
                )}
          </MainCard>
        </Grid>
      </Grow>

      <CategoryBreakdownModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        items={items}
        chartColors={colors}
      />
    </>
  )
}

export default DonutRankedCard
