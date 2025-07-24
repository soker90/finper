import { Box, CircularProgress } from '@mui/material'
import Logo from 'components/Logo'
import { Container } from './Container'
import { styles } from './styles'

const SlashScreen = () => (
  <Container>
    <Box
      display='flex'
      justifyContent='center'
      mb={6}
    >
      <Logo sx={styles.logo} />
    </Box>
    <CircularProgress />
  </Container>
)

export default SlashScreen
