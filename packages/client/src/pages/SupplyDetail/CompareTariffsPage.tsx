import { useParams, useNavigate } from 'react-router'
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Alert,
  Grid,
  Skeleton,
  Chip
} from '@mui/material'
import { ArrowLeftOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons'
import { useTariffsComparison } from 'hooks/useTariffsComparison'
import { useSupply } from 'hooks'
import { useMemo } from 'react'
import { supplyDisplayName } from '../Supplies/utils/supply'
import { format } from 'utils'
import TariffRow from './components/TariffRow'

const CompareTariffsPage = () => {
  const { supplyId } = useParams<{ supplyId: string }>()
  const navigate = useNavigate()

  const { supply } = useSupply(supplyId)
  const { comparison, error, isLoading } = useTariffsComparison(supplyId)

  const headerStats = useMemo(() => {
    if (!comparison || comparison.length === 0) return null
    const winner = comparison[0]
    return { winner }
  }, [comparison])

  if (error) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity='error' variant='filled'>
          {error.response?.data?.message || 'Error al obtener la comparativa de tarifas.'}
        </Alert>
        <Button size='small' startIcon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Volver</Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Stack direction='row' alignItems='center' spacing={2}>
          <Button
            size='small'
            startIcon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            Atrás
          </Button>
          <Box>
            <Typography variant='h4' fontWeight='700'>
              Analizador de Tarifas
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Simulación de precisión para <strong>{supply ? supplyDisplayName(supply) : ''}</strong>
            </Typography>
          </Box>
        </Stack>
        {!isLoading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'primary.light'
            }}
          >
            <ThunderboltOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
            <Typography variant='subtitle2' fontWeight='600'>Simulación basada en tus facturas</Typography>
          </Box>
        )}
      </Box>

      {/* Hero Card: Sección Top */}
      {isLoading
        ? (
          <Skeleton variant='rectangular' height={160} sx={{ borderRadius: 2 }} />
          )
        : headerStats
          ? (
            <Card
              sx={{
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'success.light',
                bgcolor: 'success.lighter',
                boxShadow: (theme: any) => theme.customShadows?.z1,
                overflow: 'visible',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -12,
                  right: 24,
                  bgcolor: 'success.main',
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  boxShadow: 2
                }}
              >
                <TrophyOutlined />
                <Typography variant='caption' fontWeight={700}>MEJOR OPCIÓN</Typography>
              </Box>
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={4} alignItems='center'>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant='overline' color='success.main' fontWeight={800} letterSpacing={1.2}>
                      RECOMENDACIÓN PERSONALIZADA
                    </Typography>
                    <Typography variant='h3' fontWeight={800} gutterBottom>
                      {headerStats.winner.comercializadora}
                    </Typography>
                    <Typography variant='h6' color='text.secondary' fontWeight={500}>
                      Tarifa: {headerStats.winner.nombreTarifa}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Box
                      sx={{
                        bgcolor: 'background.paper',
                        p: 3,
                        borderRadius: 2,
                        textAlign: 'center',
                        boxShadow: (theme: any) => theme.customShadows?.z1,
                        border: '1px solid',
                        borderColor: 'success.light'
                      }}
                    >
                      <Typography variant='body2' color='text.secondary' gutterBottom>
                        {headerStats.winner.ahorroAnualEstimado > 0 ? 'Ahorro anual estimado' : 'Coste extra anual estimado'}
                      </Typography>
                      <Typography
                        variant='h2'
                        color={headerStats.winner.ahorroAnualEstimado > 0 ? 'success.main' : 'error.main'}
                        fontWeight={900}
                      >
                        {format.euro(Math.abs(headerStats.winner.ahorroAnualEstimado))}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Frente a proyección de tu tarifa hoy
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            )
          : null}

      {/* Tabla Comparativa: Sección Bottom */}
      <Box>
        <Typography variant='h5' fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          Comparativa Detallada
          <Chip label={`${comparison?.length || 0} tarifas analizadas`} size='small' variant='outlined' />
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={40} sx={{ bgcolor: 'grey.50' }} />
                <TableCell sx={{ bgcolor: 'grey.50' }}><Typography variant='subtitle2' fontWeight='700'>Tarifa / Comercializadora</Typography></TableCell>
                <TableCell align='center' sx={{ bgcolor: 'grey.50' }}><Typography variant='subtitle2' fontWeight='700'>Potencia / Energía</Typography></TableCell>
                <TableCell align='right' sx={{ bgcolor: 'grey.50' }}><Typography variant='subtitle2' fontWeight='700'>Ahorro Anual Estimado</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4} sx={{ py: 2 }}>
                          <Skeleton variant='text' height={40} />
                        </TableCell>
                      </TableRow>
                    ))
                  )
                : comparison && comparison.length > 0
                  ? (
                      comparison.map((row, index) => (
                        <TariffRow
                          key={`${row.comercializadora}-${row.nombreTarifa}`}
                          row={row}
                          isBest={index === 0}
                        />
                      ))
                    )
                  : (
                    <TableRow>
                      <TableCell colSpan={4} align='center' sx={{ py: 8 }}>
                        <Typography color='text.secondary'>No se han encontrado comparativas disponibles.</Typography>
                      </TableCell>
                    </TableRow>
                    )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ bgcolor: 'info.lighter', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
        <Typography variant='subtitle2' gutterBottom fontWeight='700' color='info.main'>
          Sobre este análisis energético:
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Este informe no utiliza medias nacionales ni estimaciones genéricas. Hemos procesado cada una de tus facturas históricas registradas en <strong>Finper</strong> aplicando rigurosamente los términos de potencia, energía e impuestos de cada tarifa del mercado para darte una precisión del 100% sobre tu ahorro real.
        </Typography>
      </Box>
    </Stack>
  )
}

export default CompareTariffsPage
