import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Stack,
  Box,
  Typography
} from '@mui/material'
import { CloseOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { type RankedItem } from '../../utils/groupWithOthers'

interface CategoryBreakdownModalProps {
  open: boolean
  onClose: () => void
  title: string
  items: RankedItem[]
  chartColors: string[]
}

const CategoryBreakdownModal = ({
  open,
  onClose,
  title,
  items,
  chartColors
}: CategoryBreakdownModalProps) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Typography variant='h6'>{title}</Typography>
          <IconButton size='small' onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {items.length === 0
          ? (
            <Typography variant='body1' color='textSecondary'>Sin datos</Typography>
            )
          : (
            <Stack spacing={1.5}>
              {items.map((item, i) => {
                const pct = total > 0 ? (item.amount / total) * 100 : 0
                const color = chartColors[i % chartColors.length]
                return (
                  <Stack
                    key={item.name}
                    direction='row'
                    alignItems='center'
                    justifyContent='space-between'
                    spacing={1}
                  >
                    <Stack direction='row' alignItems='center' gap={1} sx={{ minWidth: 0 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                      <Typography variant='body2' noWrap>{item.name}</Typography>
                    </Stack>
                    <Stack direction='row' alignItems='center' spacing={1.5} sx={{ flexShrink: 0 }}>
                      <Typography variant='body2' color='textSecondary'>
                        {pct.toFixed(1)}%
                      </Typography>
                      <Typography variant='body2' fontWeight={600}>
                        {format.euro(item.amount)}
                      </Typography>
                    </Stack>
                  </Stack>
                )
              })}
            </Stack>
            )}
      </DialogContent>
    </Dialog>
  )
}

export default CategoryBreakdownModal
