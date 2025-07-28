import { styled, LinearProgress } from '@mui/material'

const Content = styled('div')(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 2001,
  width: '100%',
  '& > * + *': {
    marginTop: theme.spacing(2)
  }
}))

const Loader = () => (
  <Content>
    <LinearProgress color='primary' />
  </Content>
)

export default Loader
