import { TariffComparison } from 'hooks/useTariffsComparison'
import { Box, Grid, Typography } from '@mui/material'
import { TrophyOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
import { format } from 'utils'

interface Props {
  winner: TariffComparison
}

const WinnerCard = ({ winner }: Props) => (
  <MainCard
    content={false}
    sx={{
      border: '2px solid',
      borderColor: 'success.light',
      bgcolor: 'success.lighter',
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
    <Grid container spacing={4} alignItems='center' sx={{ p: 4 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Typography variant='overline' color='success.main' fontWeight={800} letterSpacing={1.2}>
          RECOMENDACIÓN PERSONALIZADA
        </Typography>
        <Typography variant='h3' fontWeight={800} gutterBottom>
          {winner.retailer}
        </Typography>
        <Typography variant='h6' color='text.secondary' fontWeight={500}>
          Tarifa: {winner.tariffName}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'success.light'
          }}
        >
          <Typography variant='body2' color='text.secondary' gutterBottom>
            {winner.estimatedAnnualSavings > 0 ? 'Ahorro anual estimado' : 'Coste extra anual estimado'}
          </Typography>
          <Typography
            variant='h2'
            color={winner.estimatedAnnualSavings > 0 ? 'success.main' : 'error.main'}
            fontWeight={900}
          >
            {format.euro(Math.abs(winner.estimatedAnnualSavings))}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Frente a proyección de tu tarifa hoy
          </Typography>
        </Box>
      </Grid>
    </Grid>
  </MainCard>
)

export default WinnerCard
