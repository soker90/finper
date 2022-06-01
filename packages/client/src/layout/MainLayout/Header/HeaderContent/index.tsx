import { Box, useMediaQuery } from '@mui/material'

import LogoutButton from './LogoutButton'

const HeaderContent = () => {
  const matchesXs = useMediaQuery((theme: any) => theme.breakpoints.down('md'))

  return (
        <>
            {!matchesXs && <Box sx={{ width: '100%', ml: { xs: 0, md: 1 } }} />}
            {matchesXs && <Box sx={{ width: '100%', ml: 1 }} />}

            <LogoutButton />
        </>
  )
}

export default HeaderContent
