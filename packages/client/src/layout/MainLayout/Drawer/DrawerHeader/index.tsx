import { useTheme } from '@mui/material/styles'
import { Stack, Chip, Box } from '@mui/material'

import Logo from 'components/Logo'

const DrawerHeader = ({ open }: { open: boolean }) => {
  const theme = useTheme()

  return (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          paddingLeft: theme.spacing(open ? 3 : 0),
          paddingTop: theme.spacing(1.5),
          paddingBottom: theme.spacing(1.5)
        }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Logo />
                <Chip
                    label={'v1.3.0'}
                    size="small"
                    sx={{ height: 16, '& .MuiChip-label': { fontSize: '0.625rem', py: 0.25 } }}
                />
            </Stack>
        </Box>
  )
}
export default DrawerHeader
