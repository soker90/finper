import { Suspense } from 'react'
import ThemeCustomization from 'themes'
import { Loader } from 'components'
import Routes from './routes'
import { SwrProvider } from './contexts'

function App () {
  return (
        <ThemeCustomization>
            <SwrProvider>
                <Suspense fallback={<Loader />}>
                    <Routes />
                </Suspense>
            </SwrProvider>
        </ThemeCustomization>
  )
}

export default App
