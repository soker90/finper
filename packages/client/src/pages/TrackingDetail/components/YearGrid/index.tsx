import { useNavigate } from 'react-router'
import { Chip, Grid, Stack, Typography } from '@mui/material'
import { MainCard } from 'components'
import { TagYearSummary } from 'types'
import { format } from 'utils'
import { hoverCardSx } from '../../../Dashboard/components/shared'

interface YearGridProps {
  tagName: string
  years: TagYearSummary[]
  compact?: boolean
}

const YearGrid = ({ tagName, years, compact = false }: YearGridProps) => {
  const navigate = useNavigate()

  return (
    <Grid container spacing={compact ? 1 : 2}>
      {years.map((yearData) => (
        <Grid key={yearData.year} size={{ xs: 6, sm: compact ? 4 : 3, md: compact ? 3 : 2 }}>
          <MainCard
            contentSX={{ p: compact ? 1.5 : 2 }}
            sx={{
              ...hoverCardSx,
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/seguimientos/${tagName}/${yearData.year}`)}
          >
            <Stack spacing={0.5}>
              <Typography variant={compact ? 'body2' : 'h6'} fontWeight={600} color='text.secondary'>
                {yearData.year}
              </Typography>
              <Typography variant={compact ? 'body1' : 'h5'} fontWeight={600} color='text.primary'>
                {format.euro(yearData.totalAmount)}
              </Typography>
              <Chip label={`${yearData.transactionCount} mov.`} size='small' variant='outlined' sx={{ alignSelf: 'flex-start' }} />
            </Stack>
          </MainCard>
        </Grid>
      ))}
    </Grid>
  )
}

export default YearGrid
