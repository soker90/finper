import { Box, Grid } from '@mui/material'
import { Outlet } from 'react-router-dom'

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
                <Grid item xs={12} sx={{ ml: 3, mt: 3 }}>
                    <Logo/>
                </Grid>
                <Grid item xs={12}>
                    <Grid
                        item
                        xs={12}
                        container
                        justifyContent="center"
                        alignItems="center"
                        sx={{ minHeight: 'calc(100vh - 60px)' }}
                    >
                        <Grid item>
                            <AuthCard><Outlet/></AuthCard>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    </GuestGuard>
)

export default AuthLayout
