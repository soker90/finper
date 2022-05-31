import { Box, Grid } from '@mui/material'
import { Outlet } from 'react-router-dom'

import AuthCard from './components/AuthCard'
import { Logo } from 'components'

const AuthLayout = () => (
    <Box sx={{ minHeight: '100vh' }}>
        <Grid
            container
            direction="column"
            justifyContent="flex-end"
            sx={{
              minHeight: '100vh'
            }}
        >
            <Grid item xs={12} sx={{ ml: 3, mt: 3 }}>
                <Logo />
            </Grid>
            <Grid item xs={12}>
                <Grid
                    item
                    xs={12}
                    container
                    justifyContent="center"
                    alignItems="center"
                    sx={{ minHeight: { xs: 'calc(100vh - 134px)', md: 'calc(100vh - 112px)' } }}
                >
                    <Grid item>
                        <AuthCard><Outlet/></AuthCard>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    </Box>
)
export default AuthLayout
