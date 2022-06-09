import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import axios from 'axios'

const SwrProvider = ({ children }: { children: ReactNode }) => {
  return (
        <SWRConfig
            value={{
              refreshInterval: 3000,
              fetcher: (url) => axios.get(url).then(res => res.data)
            }}
        >
            {children}
        </SWRConfig>
  )
}

export default SwrProvider
