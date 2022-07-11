/* eslint-disable import/export */
import React, { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from 'contexts/AuthContext'
import { BrowserRouter } from 'react-router-dom'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import esLocale from 'dayjs/locale/es'
import ThemeCustomization from 'themes/index'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { SwrProvider } from 'contexts/index'
import Auth from 'components/Auth'

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
        <AuthProvider>
            <BrowserRouter basename="/">
                <ThemeCustomization>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={esLocale}>
                        <SwrProvider>
                            <Auth>

                                {children}
                            </Auth>
                        </SwrProvider>
                    </LocalizationProvider>
                </ThemeCustomization>
            </BrowserRouter>
        </AuthProvider>
  )
}

const customRender = (ui: any, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }
