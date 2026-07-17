import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { Snackbar, Alert } from '@mui/material'

type SnackbarSeverity = 'success' | 'error'

export type SnackbarContextParams = {
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

const defaultParams: SnackbarContextParams = {
  showSuccess: () => {},
  showError: () => {}
}

const SnackbarContext = createContext<SnackbarContextParams>(defaultParams)

export default SnackbarContext

export const useSnackbar = (): SnackbarContextParams => useContext(SnackbarContext)

type ProviderProps = {
  children: ReactNode
}

export const SnackbarProvider = ({ children }: ProviderProps) => {
  const [state, setState] = useState<{ message: string, severity: SnackbarSeverity } | null>(null)

  const show = useCallback((message: string, severity: SnackbarSeverity) => {
    setState({ message, severity })
  }, [])

  const showSuccess = useCallback((message: string) => show(message, 'success'), [show])
  const showError = useCallback((message: string) => show(message, 'error'), [show])
  const handleClose = () => setState(null)

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError }}>
      {children}
      <Snackbar
        open={Boolean(state)}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {state
          ? (
            <Alert onClose={handleClose} severity={state.severity} variant='filled' sx={{ width: '100%' }}>
              {state.message}
            </Alert>
            )
          : undefined}
      </Snackbar>
    </SnackbarContext.Provider>
  )
}
