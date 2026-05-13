import { Grid, Skeleton, Stack, Box, Fade, Avatar, Typography, Button, Alert } from '@mui/material'
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons'
import MainCard from 'components/MainCard'

const BAR_HEIGHTS = [120, 200, 80, 160, 220, 100, 180, 240, 90, 150, 210, 70]

// ── Granular skeletons ────────────────────────────────────────────────────────

export const BudgetCardSkeleton = () => (
  <Grid size={{ xs: 12, md: 4 }}>
    <MainCard sx={{ height: 240, borderRadius: 2 }}>
      <Skeleton variant='rounded' height='100%' />
    </MainCard>
  </Grid>
)

export const PieChartSkeleton = ({ height = 270 }: { height?: number }) => (
  <Stack sx={{ height, alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton variant='circular' width={160} height={160} />
    <Stack spacing={1} sx={{ mt: 3, width: '100%', px: 2 }}>
      {[...Array(3)].map((_, i) => (
        <Stack key={i} direction='row' spacing={1} sx={{ alignItems: 'center' }}>
          <Skeleton variant='circular' width={12} height={12} />
          <Skeleton variant='text' width='60%' height={16} />
        </Stack>
      ))}
    </Stack>
  </Stack>
)

// ── Full loading skeleton ─────────────────────────────────────────────────────
export const DashboardSkeleton = () => (
  <Grid container spacing={3}>
    {[...Array(4)].map((_, i) => (
      <Grid key={`kpi-${i}`} size={{ xs: 12, sm: 6, md: 3 }}>
        <MainCard contentSX={{ p: 2.25 }}>
          <Stack spacing={1}>
            <Stack
              direction='row'
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Skeleton variant='text' width='60%' height={20} />
              <Skeleton variant='circular' width={36} height={36} />
            </Stack>
            <Skeleton variant='text' width='45%' height={32} />
            <Skeleton variant='text' width='70%' height={14} />
          </Stack>
        </MainCard>
      </Grid>
    ))}
    <Grid size={{ xs: 12, md: 8 }}>
      <MainCard>
        <Skeleton variant='text' width='30%' height={20} sx={{ mb: 1 }} />
        <Stack
          direction='row'
          spacing={1}
          sx={{
            alignItems: 'flex-end',
            height: 260
          }}
        >
          {[...Array(12)].map((_, i) => (
            <Skeleton key={`bar-${i}`} variant='rounded' width='100%' height={BAR_HEIGHTS[i]} sx={{ borderRadius: 1 }} />
          ))}
        </Stack>
      </MainCard>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <MainCard>
        <Stack spacing={2.5} sx={{ py: 1 }}>
          {[...Array(3)].map((_, i) => (
            <Stack
              key={`mini-${i}`} direction='row' spacing={1.5} sx={{
                alignItems: 'center'
              }}
            >
              <Skeleton variant='circular' width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant='text' width='60%' height={14} />
                <Skeleton variant='text' width='40%' height={20} />
              </Box>
            </Stack>
          ))}
        </Stack>
      </MainCard>
    </Grid>
    {[5, 4, 3].map((md, i) => (
      <Grid key={`skel-card-${i}`} size={{ xs: 12, md }}>
        <Skeleton variant='rounded' height={240} sx={{ borderRadius: 2 }} />
      </Grid>
    ))}
    <Grid size={{ xs: 12 }}>
      <Skeleton variant='rounded' height={180} sx={{ borderRadius: 2 }} />
    </Grid>
  </Grid>
)

// ── Error state ───────────────────────────────────────────────────────────────
export const DashboardError = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
  <Fade in timeout={400}>
    <Box>
      <MainCard>
        <Stack
          spacing={3}
          sx={{
            alignItems: 'center',
            py: 6
          }}
        >
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'error.lighter' }}>
            <WarningOutlined style={{ fontSize: 32, color: '#f5222d' }} />
          </Avatar>
          <Stack
            spacing={1} sx={{
              alignItems: 'center'
            }}
          >
            <Typography variant='h5'>Error al cargar el dashboard</Typography>
            <Typography variant='body1' color='textSecondary' align='center' sx={{ maxWidth: 400 }}>
              No se pudieron cargar los datos financieros. Comprueba tu conexión e inténtalo de nuevo.
            </Typography>
          </Stack>
          {error?.message && (
            <Alert severity='error' sx={{ maxWidth: 400 }}>
              {error.message}
            </Alert>
          )}
          <Button
            variant='contained'
            startIcon={<ReloadOutlined />}
            onClick={onRetry}
          >
            Reintentar
          </Button>
        </Stack>
      </MainCard>
    </Box>
  </Fade>
)
