import { Suspense } from 'react'
import ThemeCustomization from 'themes'
import { Loader } from 'components'
import Routes from './routes'

function App () {
  return (
        <ThemeCustomization>
            <Suspense fallback={<Loader/>}>
                <Routes/>
            </Suspense>
        </ThemeCustomization>
  )
}

export default App
