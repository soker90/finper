import { useState } from 'react'
import { FormHelperText, Grid } from '@mui/material'

export const useApiError = () => {
  const [apiError, setApiError] = useState<string | undefined>(undefined)
  const ApiErrorMessage = apiError
    ? <Grid size={12}><FormHelperText error>{apiError}</FormHelperText></Grid>
    : null
  return { apiError, setApiError, ApiErrorMessage }
}
