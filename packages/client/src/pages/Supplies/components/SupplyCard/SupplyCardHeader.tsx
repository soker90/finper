import { MouseEvent } from 'react'
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Supply } from 'types'
import { SUPPLY_TYPE_LABELS } from '../../utils/supply'

const SUPPLY_TYPE_COLORS: Record<string, 'warning' | 'info' | 'error' | 'primary' | 'default'> = {
  electricity: 'warning',
  water: 'info',
  gas: 'error',
  internet: 'primary',
  other: 'default'
}

type Props = {
  supply: Supply
  onEdit: (e: MouseEvent) => void
  onDelete: (e: MouseEvent) => void
}

const SupplyCardHeader = ({ supply, onEdit, onDelete }: Props) => (
  <Box display='flex' justifyContent='space-between' alignItems='center'>
    <Stack direction='row' spacing={1} alignItems='center' minWidth={0}>
      <Chip
        label={SUPPLY_TYPE_LABELS[supply.type]}
        color={SUPPLY_TYPE_COLORS[supply.type] ?? 'default'}
        size='small'
        sx={{ fontWeight: 600 }}
      />
      {supply.type === 'other' && supply.name && (
        <Typography variant='body2' color='textSecondary' noWrap>
          {supply.name}
        </Typography>
      )}
    </Stack>

    <Stack direction='row' spacing={0.5}>
      <Tooltip title='Editar'>
        <IconButton size='small' aria-label='Editar' onClick={onEdit}>
          <EditOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title='Eliminar'>
        <IconButton size='small' color='error' aria-label='Eliminar' onClick={onDelete}>
          <DeleteOutlined />
        </IconButton>
      </Tooltip>
    </Stack>
  </Box>
)

export default SupplyCardHeader
