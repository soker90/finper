import { Grid } from '@mui/material'
import SimpleTable from 'components/SimpleTable'

const DashboardDefault = () => {
  return (<Grid container spacing={3}>
        <Grid item xs={12} md={6}>
            <SimpleTable/>
        </Grid>
        <Grid item xs={12} md={6}>
            <SimpleTable/>
        </Grid>
    </Grid>)
}

export default DashboardDefault
