import { Grid, Grow, Skeleton, Stack, Typography, Avatar } from '@mui/material'
import { FundOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
import { format } from 'utils'
import { useStocksSummary } from 'hooks'
import SectionTitle from './SectionTitle'
import { hoverCardSx } from './shared'

const StocksWidget = () => {
  const { summary, isLoading, error } = useStocksSummary()

  if (error) return null

  if (!isLoading && !summary?.totalCost) return null

  return (
    <>
      <SectionTitle>Cartera de acciones</SectionTitle>
      <Grow in timeout={400}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard contentSX={{ p: 2.25 }} sx={hoverCardSx}>
            <Stack spacing={0.5}>
              <Stack
                direction='row'
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant='body1' color='textSecondary'>Coste invertido</Typography>
                <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 36, height: 36 }}>
                  <FundOutlined />
                </Avatar>
              </Stack>
              <Typography variant='h4'>
                {isLoading ? <Skeleton width={80} /> : format.euro(summary?.totalCost ?? 0)}
              </Typography>
              <Typography variant='body2' color='textSecondary'>Capital total invertido</Typography>
            </Stack>
          </MainCard>
        </Grid>
      </Grow>
      <Grow in timeout={500}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard contentSX={{ p: 2.25 }} sx={hoverCardSx}>
            <Stack spacing={0.5}>
              <Stack
                direction='row'
                sx={{
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant='body1' color='textSecondary'>Valor actual</Typography>
                <Avatar sx={{ bgcolor: 'success.lighter', color: 'success.main', width: 36, height: 36 }}>
                  <FundOutlined />
                </Avatar>
              </Stack>
              <Typography variant='h4'>
                {isLoading
                  ? <Skeleton width={80} />
                  : summary?.totalValue !== null && summary?.totalValue !== undefined
                    ? format.euro(summary.totalValue)
                    : <Typography component='span' variant='h4' color='textSecondary'>No disponible</Typography>}
              </Typography>
              <Typography variant='body2' color='textSecondary'>Precio de mercado actual</Typography>
            </Stack>
          </MainCard>
        </Grid>
      </Grow>
    </>
  )
}

export default StocksWidget
