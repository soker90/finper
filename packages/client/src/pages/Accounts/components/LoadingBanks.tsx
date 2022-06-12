import { FC } from 'react'
import { Skeleton } from '@mui/material'

const LoadingBanks: FC = () => (
    <>
        {
            [...Array(5)
            ].map((none, idx) =>
                <Skeleton key={idx} height={128} animation="wave" />
            )
        }
    </>
)

export default LoadingBanks
