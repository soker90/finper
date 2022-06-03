import { Suspense } from 'react'
import ThemeCustomization from 'themes'
import { Loader } from 'components'
import Routes from './routes'
import { SwrProvider } from './contexts'
import 'utils/axios'
import Auth from 'components/Auth'

function App () {
  return (
        <ThemeCustomization>
            <SwrProvider>
                <Auth>
                    <Suspense fallback={<Loader/>}>
                        <Routes/>
                    </Suspense>
                </Auth>
            </SwrProvider>
        </ThemeCustomization>
  )
}

export default App
