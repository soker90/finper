import { Box, Button, Chip, Typography } from '@mui/material'
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Supply } from 'types'
import { HeaderButtons } from 'components'
import { SUPPLY_TYPE_COLORS, SUPPLY_TYPE_LABELS, supplyDisplayName } from '../../Supplies/utils/supply'

interface Props {
  supply: Supply
  onBack: () => void
  onAddReading: () => void
  onEditSupply: () => void
  onCompareTariffs: () => void
}

const SupplyDetailHeader = ({ supply, onBack, onAddReading, onEditSupply, onCompareTariffs }: Props) => {
  const actionButtons = [
    { Icon: EditOutlined, title: 'Editar', onClick: onEditSupply },
    ...(supply.type === 'electricity'
      ? [{ Icon: ThunderboltOutlined, title: 'Comparar tarifas', onClick: onCompareTariffs }]
      : []),
    { Icon: PlusOutlined, title: 'Añadir lectura', onClick: onAddReading }
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Button startIcon={<ArrowLeftOutlined />} onClick={onBack} size='small'>
          Volver
        </Button>
        <Typography variant='h4'>{supplyDisplayName(supply)}</Typography>
        <Chip
          label={SUPPLY_TYPE_LABELS[supply.type]}
          color={SUPPLY_TYPE_COLORS[supply.type] ?? 'default'}
          size='small'
        />
      </Box>
      <HeaderButtons buttons={actionButtons} desktopSx={{}} />
    </Box>
  )
}

export default SupplyDetailHeader
