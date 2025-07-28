import { FC } from 'react'
import { Skeleton } from '@mui/material'

const LoadingList: FC = () => (
  <>
    {
            Array.from({ length: 8 })
              .map((none, idx) =>
                <Skeleton
                  key={idx} animation='wave' variant='rectangular'
                  width='auto'
                  height={50}
                  sx={{ marginBottom: 1.5 }}
                />
              )
        }
  </>
)

export default LoadingList
