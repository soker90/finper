import { alpha } from '@mui/material/styles'
import { Theme } from '@mui/material'

const CustomShadows = (theme: Theme) => ({
  button: '0 2px #0000000b',
  text: '0 -1px 0 rgb(0 0 0 / 12%)',
  z1: `0px 2px 8px ${alpha(theme.palette.grey[900], 0.15)}`
})

export default CustomShadows
