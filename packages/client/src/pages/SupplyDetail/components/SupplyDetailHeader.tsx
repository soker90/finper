import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Supply } from 'types'
import { SUPPLY_TYPE_COLORS, SUPPLY_TYPE_LABELS, supplyDisplayName } from '../../Supplies/utils/supply'

interface Props {
  supply: Supply
  onBack: () => void
  onAddReading: () => void
  onEditSupply: () => void
  onCompareTariffs: () => void
}

const SupplyDetailHeader = ({ supply, onBack, onAddReading, onEditSupply, onCompareTariffs }: Props) => (
  <Box display='flex' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={1}>
    <Box display='flex' alignItems='center' gap={1}>
      <Button startIcon={<ArrowLeftOutlined />} onClick={onBack} size='small'>
        Volver
      </Button>
      <Typography variant='h4'>{supplyDisplayName(supply)}</Typography>
      <Chip
        label={SUPPLY_TYPE_LABELS[supply.type]}
        color={SUPPLY_TYPE_COLORS[supply.type] ?? 'default'}
        size='small'
      />
      <IconButton size='small' onClick={onEditSupply}>
        <EditOutlined style={{ fontSize: '18px' }} />
      </IconButton>
    </Box>
    <Stack direction='row' spacing={1}>
      {supply.type === 'electricity' && (
        <Button variant='outlined' startIcon={<ThunderboltOutlined />} onClick={onCompareTariffs}>
          Comparar tarifas
        </Button>
      )}
      <Button variant='outlined' startIcon={<PlusOutlined />} onClick={onAddReading}>
        Añadir lectura
      </Button>
    </Stack>
  </Box>
)

export default SupplyDetailHeader
