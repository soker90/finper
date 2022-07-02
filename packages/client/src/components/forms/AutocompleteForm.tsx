import {
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Stack,
  NativeSelect, Autocomplete, TextField
} from '@mui/material'
import { forwardRef, Ref, SyntheticEvent } from 'react'

interface Props {
    id: string
    label: string
    placeholder?: string
    size?: number
    options: any[]
    optionValue: string | number
    optionLabel: string | number
    // onChange?: (event: SyntheticEvent, value: any | Array<any>, reason: string, details?: string) => void
    value?: string
    // onKeyDown?: any
    error?: boolean
    errorText?: string
}

const AutocompleteForm = ({
  id,
  label,
  size = 4,
  options,
  optionValue,
  optionLabel,
  errorText,
  placeholder,
  value,
  ...others
}: Props, ref: Ref<HTMLInputElement>) => {
  console.log(others, value)
  return (
        <Grid item md={size} xs={12}>
            <Stack spacing={1}>
                <InputLabel htmlFor={id}>{label}</InputLabel>
                <Autocomplete
                    freeSolo
                    // autoComplete
                    // autoSelect
                    selectOnFocus
                    options={options}
                    getOptionLabel={(option: any) => {
                        console.log(option)
                        return option[optionLabel]
                    }}
                    fullWidth
                    inputValue={value}
                    noOptionsText=''
                    ref={ref}
                    renderInput={(params: any) => (
                        <OutlinedInput
                            id={id}
                            ref={params.InputProps.ref}
                            sx={{ height: 40 }}
                            placeholder={placeholder}
                            {...params} />)}
                    {...others}
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
