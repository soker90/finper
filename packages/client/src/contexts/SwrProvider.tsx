import { ReactNode } from 'react'
import { SWRConfig } from 'swr'

const SwrProvider = ({ children }: { children: ReactNode }) => {
  return (
        <SWRConfig
            value={{
              refreshInterval: 3000,
              fetcher: (resource, init) => fetch(resource, init).then(res => res.json())
            }}
        >
            {children}
        </SWRConfig>
  )
}

export default SwrProvider
