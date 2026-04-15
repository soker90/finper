import { Box, Button, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons'

interface Props {
  supplyName: string
  isLoading: boolean
  onBack: () => void
}

const TariffPageHeader = ({ supplyName, isLoading, onBack }: Props) => (
  <Box display='flex' alignItems='center' justifyContent='space-between'>
    <Stack direction='row' alignItems='center' spacing={2}>
      <Button size='small' startIcon={<ArrowLeftOutlined />} onClick={onBack}>
        Atrás
      </Button>
      <Box>
        <Typography variant='h4' fontWeight='700'>Analizador de Tarifas</Typography>
        <Typography variant='body2' color='text.secondary'>
          Simulación de precisión para <strong>{supplyName}</strong>
        </Typography>
      </Box>
    </Stack>
    {!isLoading && (
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderRadius: 2, bgcolor: 'primary.lighter', color: 'primary.main', border: '1px solid', borderColor: 'primary.light' }}>
        <ThunderboltOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
        <Typography variant='subtitle2' fontWeight='600'>Simulación basada en tus facturas</Typography>
      </Box>
    )}
  </Box>
)

export default TariffPageHeader
