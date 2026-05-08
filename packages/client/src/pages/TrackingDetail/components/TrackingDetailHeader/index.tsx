import { useNavigate } from 'react-router'
import { Button, Chip, Skeleton, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { format } from 'utils'

interface TrackingDetailHeaderProps {
  tagName: string
  year?: number
  totalAmount: number
  transactionCount?: number
  isHistoric?: boolean
  loading?: boolean
}

const TrackingDetailHeader = ({
  tagName,
  year,
  totalAmount,
  transactionCount,
  isHistoric = false,
  loading = false
}: TrackingDetailHeaderProps) => {
  const navigate = useNavigate()

  return (
    <Stack spacing={1.5}>
      {/* Navegación */}
      <Button
        startIcon={<ArrowLeftOutlined />}
        onClick={() => navigate('/seguimientos')}
        size='small'
        sx={{ alignSelf: 'flex-start' }}
      >
        Volver
      </Button>

      {/* Título + chip de año */}
      <Stack direction='row' alignItems='center' spacing={2} flexWrap='wrap'>
        <Typography variant='h3'>{tagName}</Typography>
        {year && <Chip label={year} color='primary' size='small' />}
      </Stack>

      {/* Total + conteo (skeleton mientras carga) */}
      {loading
        ? <Skeleton variant='text' width={180} height={36} />
        : (
          <Stack direction='row' alignItems='baseline' spacing={2} flexWrap='wrap'>
            <Typography variant='body1' color='text.secondary'>
              {isHistoric ? 'Total acumulado' : 'Total'}
            </Typography>
            <Typography variant='h4' color='text.primary'>
              {format.euro(totalAmount)}
            </Typography>
            {transactionCount !== undefined && (
              <Chip label={`${transactionCount} movimientos`} size='small' variant='outlined' />
            )}
          </Stack>
          )}
    </Stack>
  )
}

export default TrackingDetailHeader
