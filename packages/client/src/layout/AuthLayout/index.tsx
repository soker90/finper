import { Box, Grid } from '@mui/material'
import { Outlet } from 'react-router'

import { Logo } from 'components'
import { AuthCard, AuthBackground } from './components'
import GuestGuard from 'guards/GuestGuard'

const AuthLayout = () => (
    <GuestGuard>
        <Box sx={{ minHeight: '100vh' }}>
            <AuthBackground/>
            <Grid
                container
                direction="column"
                justifyContent="flex-end"
                sx={{
                  minHeight: '100vh'
                }}
            >
                <Grid size={12} sx={{ ml: 3, mt: 3 }}>
                    <Logo/>
                </Grid>
                <Grid size={12}>
                    <Grid
                        size={12}
                        container
                        justifyContent="center"
                        alignItems="center"
                        sx={{ minHeight: 'calc(100vh - 60px)' }}
                    >
                        <Grid>
                            <AuthCard><Outlet/></AuthCard>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    </GuestGuard>
)

export default AuthLayout
