import { Stack, Typography } from '@mui/material'
import { MainCard } from 'components'
import { format } from 'utils'

const PensionStatCard = ({ title, amount, currency = true }: { title: string, amount: number, currency?: boolean }) => (
    <MainCard contentSX={{ p: 2.25 }}>
        <Stack spacing={0.5}>
            <Typography variant="h6" color="textSecondary">
                {title}
            </Typography>
            <Typography variant="h4" color="inherit" align='center'>
                {currency ? format.euro(amount) : format.number(amount, { maximumFractionDigits: 5 })}
            </Typography>
        </Stack>

    </MainCard>
)

export default PensionStatCard
