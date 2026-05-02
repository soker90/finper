import { Grid, Grow, Stack, Typography, Button } from '@mui/material'
import { useState } from 'react'
import { UnorderedListOutlined } from '@ant-design/icons'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from '@mui/material/styles'
import MainCard from 'components/MainCard'
import { hoverCardSx } from '../../shared'
import CategoryBreakdownModal from '../CategoryBreakdownModal'
import TreemapTooltip from './TreemapTooltip'
import CustomTreemapContent from './CustomTreemapContent'
import buildTreemapData, { type CategoryItem } from './buildTreemapData'

interface TopCategoriesTreemapProps {
  items: CategoryItem[]
  chartColors: string[]
  growTimeout?: number
}

const TopCategoriesTreemap = ({ items, chartColors, growTimeout = 1300 }: TopCategoriesTreemapProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  const theme = useTheme()

  const colors = chartColors.length > 0 ? chartColors : [theme.palette.primary.main]
  const treeData = buildTreemapData(items, colors)

  return (
    <>
      <Grow in timeout={growTimeout}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MainCard
            title='Top gastos por categoría'
            sx={hoverCardSx}
            secondary={
              <Stack direction='row' alignItems='center' gap={1}>
                <Typography variant='body2' color='textSecondary'>Este mes</Typography>
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
                <Typography variant='body1' color='textSecondary'>
                  No hay gastos registrados este mes
                </Typography>
                )
              : (
                <ResponsiveContainer width='100%' height={260}>
                  <Treemap
                    data={treeData}
                    dataKey='value'
                    aspectRatio={4 / 3}
                    content={<CustomTreemapContent />}
                    animationDuration={600}
                  >
                    <Tooltip content={<TreemapTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
                )}
          </MainCard>
        </Grid>
      </Grow>

      <CategoryBreakdownModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title='Categorías — este mes'
        items={items}
        chartColors={colors}
      />
    </>
  )
}

export default TopCategoriesTreemap
