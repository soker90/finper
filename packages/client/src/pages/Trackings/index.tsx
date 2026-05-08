import { useEffect, useState } from 'react'
import { Box, Grid, MenuItem, Select, Stack, Typography } from '@mui/material'
import { useTagsStats, useAvailableTagYears } from 'hooks'
import Loader from 'components/Loader'
import TrackingCard from './components/TrackingCard'

const Trackings = () => {
  const { years, isLoading: yearsLoading } = useAvailableTagYears()
  const [year, setYear] = useState<number | null>(null)
  const { tagStats, isLoading: statsLoading } = useTagsStats(year)

  useEffect(() => {
    if (years.length > 0 && year === null) {
      setYear(years[0])
    }
  }, [years, year])

  const isLoading = yearsLoading || statsLoading

  return (
    <Stack spacing={3}>

      {/* Selector de año (el título lo aporta el Breadcrumbs del layout) */}
      {years.length > 0 && (
        <Stack direction='row' alignItems='center' spacing={1}>
          <Typography variant='body2' color='text.secondary'>Año</Typography>
          <Select
            id='year-select'
            value={year ?? ''}
            size='small'
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ minWidth: 90 }}
          >
            {years.map((yearOption) => (
              <MenuItem key={yearOption} value={yearOption}>{yearOption}</MenuItem>
            ))}
          </Select>
        </Stack>
      )}

      {yearsLoading && <Loader />}

      {!yearsLoading && years.length === 0 && (
        <Box py={6} textAlign='center'>
          <Typography color='text.secondary'>
            No hay etiquetas en ningún año. Añade etiquetas a tus movimientos para ver tus seguimientos.
          </Typography>
        </Box>
      )}

      {!isLoading && year && tagStats.length === 0 && (
        <Box py={6} textAlign='center'>
          <Typography color='text.secondary'>
            No hay etiquetas para este año.
          </Typography>
        </Box>
      )}

      {tagStats.length > 0 && (
        <Grid container spacing={3}>
          {tagStats.map((tagStat) => (
            <Grid key={tagStat.tag} size={{ xs: 12, sm: 6, md: 4 }}>
              <TrackingCard tagStat={tagStat} year={year} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  )
}

export default Trackings
