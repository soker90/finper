import { useEffect, useState } from 'react'
import { Box, Grid, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material'
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
    <Stack spacing={2}>

      {yearsLoading && <Loader />}

      {!yearsLoading && years.length === 0 && (
        <Box py={4} textAlign='center'>
          <Typography color='text.secondary'>
            No hay etiquetas en ningún año. Añade etiquetas a tus movimientos para ver tus seguimientos.
          </Typography>
        </Box>
      )}

      {years.length > 0 && (
        <Stack direction='row' alignItems='center' spacing={2}>
          <InputLabel htmlFor='year-select'>Año</InputLabel>
          <Select
            id='year-select'
            value={year ?? ''}
            size='small'
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </Stack>
      )}

      {!isLoading && year && tagStats.length === 0 && (
        <Box py={4} textAlign='center'>
          <Typography color='text.secondary'>
            No hay etiquetas para este año.
          </Typography>
        </Box>
      )}

      {tagStats.length > 0 && (
        <Grid container spacing={3}>
          {tagStats.map((tagStat) => (
            <Grid key={tagStat.tag} size={{ xs: 12, sm: 6, md: 4 }}>
              <TrackingCard tagStat={tagStat} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  )
}

export default Trackings
