import { Box, Button, Chip, Typography } from '@mui/material'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Supply } from 'types'

interface Props {
  propertyName: string
  supply: Supply | null
  onBack: () => void
}

const TariffPageHeader = ({ propertyName, supply, onBack }: Props) => (
  <Box display='flex' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={1}>
    <Box display='flex' alignItems='center' gap={1}>
      <Button startIcon={<ArrowLeftOutlined />} onClick={onBack} size='small'>
        Volver
      </Button>
      <Box>
        <Typography variant='h4'>{propertyName}</Typography>
        <Typography variant='subtitle2' color='text.secondary'>
          {supply ? (supply.name ? `${supply.name} · ${supply.type}` : supply.type) : ''}
        </Typography>
      </Box>
      <Chip label='Comparar tarifas' color='primary' size='small' />
    </Box>
  </Box>
)

export default TariffPageHeader
