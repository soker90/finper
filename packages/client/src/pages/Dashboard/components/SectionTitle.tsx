import { Grid, Typography } from '@mui/material'

const SectionTitle = ({ children }: { children: string }) => (
  <Grid size={{ xs: 12 }}>
    <Typography
      variant='overline'
      color='textSecondary'
      sx={{ letterSpacing: 1.5, fontSize: '0.7rem' }}
    >
      {children}
    </Typography>
  </Grid>
)

export default SectionTitle
