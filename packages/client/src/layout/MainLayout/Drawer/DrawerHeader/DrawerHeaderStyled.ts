import { styled } from '@mui/material/styles'
import { Box } from '@mui/material'

const DrawerHeaderStyled: any = styled(Box, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }: any) => ({
  ...theme.mixins.toolbar,
  display: 'flex',
  alignItems: 'center',
  justifyContent: open ? 'flex-start' : 'center',
  paddingLeft: theme.spacing(open ? 3 : 0)
}))

export default DrawerHeaderStyled
