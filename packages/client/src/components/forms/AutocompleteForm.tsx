import {
  FormHelperText,
  Grid,
  InputLabel,
  Stack,
  Autocomplete, TextField
} from '@mui/material'
import { forwardRef, Ref, SyntheticEvent } from 'react'

interface Props {
  id: string
  label: string
  placeholder?: string
  size?: number
  options: any[]
  optionLabel: string | number
  onChange?: (event: SyntheticEvent, value: any | Array<any>, reason: string, details?: string) => void
  value?: string
  error?: boolean
  errorText?: string
  name?: string
  onBlur?: any
  defaultValue?: any
}

const AutocompleteForm = ({
  id,
  label,
  size = 4,
  options,
  optionLabel,
  errorText,
  value,
  defaultValue,
  ...others
}: Props, ref: Ref<HTMLInputElement>) => {
  return (
    <Grid size={{ md: size, xs: 12 }}>
      <Stack spacing={1}>
        <InputLabel htmlFor={id}>{label}</InputLabel>
        <Autocomplete
          disableClearable
          sx={{ input: { height: 8 } }}
          freeSolo
          selectOnFocus
          options={options}
          getOptionLabel={(option: any) => option[optionLabel]}
          fullWidth
          noOptionsText=''
          defaultValue={defaultValue}
          renderInput={(params: any) => (
            <TextField id={id} {...params} inputRef={ref} {...others} />)}
        />
        {others.error && (
          <FormHelperText error>
            {errorText}
          </FormHelperText>
        )}
      </Stack>
    </Grid>
  )
}

export default forwardRef(AutocompleteForm)
