import { Grid, Grow, Stack, Typography } from '@mui/material'
import { SafetyOutlined } from '@ant-design/icons'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import SectionTitle from './SectionTitle'
import { hoverCardSx } from './shared'

interface NetWorthSectionProps {
  netWorth: number
}

const NetWorthSection = ({ netWorth }: NetWorthSectionProps) => (
  <>
    <SectionTitle>Patrimonio Neto</SectionTitle>

    <Grow in timeout={450}>
      <Grid size={{ xs: 12 }}>
        <MainCard sx={hoverCardSx}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between'
            }}
          >
            {/* KPI numérico */}
            <Stack spacing={0.5}>
              <Stack
                direction='row'
                sx={{
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <SafetyOutlined style={{ fontSize: 18, color: 'inherit' }} />
                <Typography variant='body1' color='textSecondary'>
                  Patrimonio Neto actual
                </Typography>
              </Stack>
              <Typography
                variant='h3' sx={{
                  fontWeight: 700
                }}
              >
                {format.euro(netWorth)}
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Balance total menos deudas y préstamos pendientes
              </Typography>
            </Stack>

          </Stack>
        </MainCard>
      </Grid>
    </Grow>
  </>
)

export default NetWorthSection
