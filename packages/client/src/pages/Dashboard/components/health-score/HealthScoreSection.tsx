import { Grid, Grow, Chip } from '@mui/material'
import { DashboardOutlined } from '@ant-design/icons'
import { type DashboardStats } from 'hooks'
import MainCard from 'components/MainCard'
import SectionTitle from '../SectionTitle'
import { getScoreColor, getScoreLabel } from '../../utils/scoreHelpers'
import { hoverCardSx } from '../shared'
import ScoreGauge from './ScoreGauge'
import HealthAdvice from './HealthAdvice'

interface HealthScoreSectionProps {
  stats: DashboardStats
}

const HealthScoreSection = ({ stats }: HealthScoreSectionProps) => {
  const { healthScore, pension } = stats

  return (
    <>
      <SectionTitle>Salud financiera</SectionTitle>

      <Grow in timeout={1400}>
        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard
            title='Score financiero'
            sx={{ ...hoverCardSx, height: '100%' }}
            secondary={
              <Chip
                size='small'
                label={getScoreLabel(healthScore.total)}
                color={getScoreColor(healthScore.total)}
                icon={<DashboardOutlined style={{ fontSize: '0.8rem' }} />}
              />
            }
          >
            <ScoreGauge healthScore={healthScore} />
          </MainCard>
        </Grid>
      </Grow>

      <Grow in timeout={1450}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title='Consejos' sx={{ ...hoverCardSx, height: '100%' }}>
            <HealthAdvice healthScore={healthScore} hasPension={pension !== null} />
          </MainCard>
        </Grid>
      </Grow>
    </>
  )
}

export default HealthScoreSection
