import { Box, Typography } from '@mui/material'

const TitleTable = ({ title }: {title?: string}) => (
  title
    ? (
      <Box p={2}>
        <Box
          display='flex'
          alignItems='center'
        >
          <Typography
            variant='h4'
            color='textPrimary'
          >
            {title}
          </Typography>
        </Box>
      </Box>
      )
    : null
)

export default TitleTable
