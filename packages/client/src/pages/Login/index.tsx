import { Grid, Stack, Typography } from '@mui/material'

import AuthLogin from './AuthLogin'

const Login = () => (
    <Grid container spacing={3}>
        <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: { xs: -0.5, sm: 0.5 } }}>
                <Typography variant="h3">Login</Typography>
            </Stack>
        </Grid>
        <Grid item xs={12}>
            <AuthLogin/>
        </Grid>
    </Grid>

)

export default Login
