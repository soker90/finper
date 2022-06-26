import { Suspense } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import ThemeCustomization from 'themes'
import { Loader } from 'components'
import Routes from './routes'
import { SwrProvider } from './contexts'
import 'utils/axios'
import Auth from 'components/Auth'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

function App () {
  return (
        <ThemeCustomization>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <SwrProvider>
                    <Auth>
                        <Suspense fallback={<Loader />}>
                            <Routes />
                        </Suspense>
                    </Auth>
                </SwrProvider>
            </LocalizationProvider>
        </ThemeCustomization>
  )
}

export default App
