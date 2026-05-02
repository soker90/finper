import { Grid, Grow, Stack, Typography, Box, Button } from '@mui/material'
import { useState } from 'react'
import { UnorderedListOutlined } from '@ant-design/icons'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from '@mui/material/styles'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { hoverCardSx } from '../shared'
import CategoryBreakdownModal from './CategoryBreakdownModal'

interface CategoryItem {
  name: string
  amount: number
  parentName?: string
}

interface TopCategoriesTreemapProps {
  items: CategoryItem[]
  chartColors: string[]
  growTimeout?: number
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
const TreemapTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item || item.name === 'Total') return null
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
      {item.parentName && (
        <Typography variant='caption' color='textSecondary' display='block'>
          {item.parentName}
        </Typography>
      )}
      <Typography variant='body2' fontWeight={600}>{item.name}</Typography>
      <Typography variant='body1' fontWeight={700} color='primary'>
        {format.euro(Number(item.amount ?? item.value))}
      </Typography>
    </Box>
  )
}

// ── Custom content — oculta label si el bloque es demasiado pequeño ──────────
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, depth, fill } = props
  const showLabel = width > 60 && height > 30 && depth > 0 && name !== 'Total'

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke='#fff'
        strokeWidth={depth === 1 ? 2 : 1}
        rx={3}
        ry={3}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor='middle'
          dominantBaseline='middle'
          fill='#fff'
          fontSize={width < 80 ? 9 : 11}
          fontWeight={600}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {name.length > 14 ? `${name.slice(0, 13)}…` : name}
        </text>
      )}
    </g>
  )
}

// ── Agrupación jerárquica: padre → hijos ────────────────────────────────────
const buildTreemapData = (items: CategoryItem[], colors: string[]) => {
  const groups = new Map<string, CategoryItem[]>()

  items.forEach(item => {
    const key = item.parentName ?? item.name
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  })

  const children = Array.from(groups.entries()).map(([groupName, groupItems], groupIndex) => {
    const baseColor = colors[groupIndex % colors.length]

    // If the group has multiple children (parentName exists), create nested nodes
    if (groupItems.length === 1 && !groupItems[0].parentName) {
      // Leaf node with no parent — show directly
      return {
        name: groupName,
        amount: groupItems[0].amount,
        value: groupItems[0].amount,
        fill: baseColor
      }
    }

    // Group node with children
    return {
      name: groupName,
      value: groupItems.reduce((s, i) => s + i.amount, 0),
      fill: baseColor,
      children: groupItems.map((item, childIndex) => ({
        name: item.name,
        parentName: groupName,
        amount: item.amount,
        value: item.amount,
        fill: baseColor,
        fillOpacity: Math.max(0.4, 1 - childIndex * 0.15)
      }))
    }
  })

  return [{ name: 'Total', children }]
}

// ── Component ─────────────────────────────────────────────────────────────────
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
