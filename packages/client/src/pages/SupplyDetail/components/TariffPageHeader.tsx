import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Supply } from 'types'

interface Props {
  propertyName: string
  supply: Supply | null
  onBack: () => void
}

const TariffPageHeader = ({ propertyName, supply, onBack }: Props) => (
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
        gap: 1.5
      }}
    >
      <Button startIcon={<ArrowLeftOutlined />} onClick={onBack} size='small'>
        Volver
      </Button>
      <Stack spacing={0.25}>
        <Stack
          direction='row' spacing={1} sx={{
            alignItems: 'center'
          }}
        >
          <Typography variant='h4'>{propertyName}</Typography>
          <Chip
            icon={<ThunderboltOutlined />}
            label='Comparar tarifas'
            color='primary'
            size='small'
          />
        </Stack>
        {supply?.name && (
          <Typography
            variant='body2' sx={{
              color: 'text.secondary'
            }}
          >
            {supply.name}
          </Typography>
        )}
      </Stack>
    </Box>
  </Box>
)

export default TariffPageHeader
