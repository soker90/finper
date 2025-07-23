import { Grid, Stack, Typography } from '@mui/material'
import { MainCard } from 'components'
import { format } from 'utils'

interface Props {
    title: string
    data?: number
    color?: string
}

const YearCard = ({ title, data = 0, color }: Props) => (
    <MainCard contentSX={{ p: 2.25 }}>
        <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight='bold' fontSize='medium'>
                {title}
            </Typography>
            <Grid container alignItems="center">
                <Grid>
                    <Typography variant="h4" sx={{ color: `${color || 'primary'}.main` }}>
                        {format.euro(data)}
                    </Typography>
                </Grid>
            </Grid>
        </Stack>
    </MainCard>
)
export default YearCard
