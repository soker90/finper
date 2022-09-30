import { Stack, Typography } from '@mui/material'
import { MainCard } from 'components'
import { format } from 'utils'

interface Props {
    value?: number
}

const TotalCard = ({ value = 0 }: Props) => (
    <MainCard contentSX={{ p: 2.25 }} sx={{ maxWidth: { sm: 250 }, marginTop: { xs: 2, sm: 0 } }}>
        <Stack spacing={0.5}>
            <Typography variant="h4">
                Total
            </Typography>
            <Typography variant="h4" sx={{ color: 'info.main' }}>
                {format.euro(value)}
            </Typography>

        </Stack>
    </MainCard>
)

export default TotalCard
