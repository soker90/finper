import { Skeleton } from '@mui/material'
import { FC, ReactElement } from 'react'

const LoadingBanks: FC = (): ReactElement => (
    <>
        {
            [...Array(5)
            ].map((idx) =>
                <Skeleton key={idx} height={128} animation="wave" />
            )
        }
    </>
)

export default LoadingBanks
