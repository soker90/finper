import { Box, MenuItem, Select, Typography } from '@mui/material'

interface Props {
  years: number[]
  selectedYear: number
  readingCount: number
  onYearChange: (year: number) => void
}

const YearSelector = ({ years, selectedYear, readingCount, onYearChange }: Props) => {
  if (years.length === 0) return null

  return (
    <Box display='flex' alignItems='center' gap={2}>
      <Typography color='textSecondary'>Año:</Typography>
      <Select
        size='small'
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
      >
        {years.map((year) => (
          <MenuItem key={year} value={year}>{year}</MenuItem>
        ))}
      </Select>
      <Typography color='textSecondary'>
        {readingCount} lectura{readingCount !== 1 ? 's' : ''}
      </Typography>
    </Box>
  )
}

export default YearSelector
