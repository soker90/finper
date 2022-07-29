import { Box, Typography } from '@mui/material'

const NoData = ({ elements }: {elements: number}) => (
  (elements === 0)
    ? (
      <Box p={2}>
        <Typography
          variant='body1'
          color='textPrimary'
          align='center'
        >
          No se han encontrado datos
        </Typography>
      </Box>
      )
    : null
)

export default NoData
