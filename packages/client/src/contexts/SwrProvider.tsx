import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import axios from 'axios'

// function localStorageProvider () {
//   // When initializing, we restore the data from `localStorage` into a map.
//   const map = new Map(JSON.parse(localStorage.getItem('app-cache') || '[]'))
//
//   // Before unloading the app, we write back all the data into `localStorage`.
//   window.addEventListener('beforeunload', () => {
//     const appCache = JSON.stringify(Array.from(map.entries()))
//     localStorage.setItem('app-cache', appCache)
//   })
//
//   // We still use the map for write & read for performance.
//   return map
// }

const SwrProvider = ({ children }: { children: ReactNode }) => {
  return (
        <SWRConfig
            value={{
              // refreshInterval: 30000,
              fetcher: (url) => axios.get(url).then(res => res.data)
              // provider: localStorageProvider
            }}
        >
            {children}
        </SWRConfig>
  )
}

export default SwrProvider
