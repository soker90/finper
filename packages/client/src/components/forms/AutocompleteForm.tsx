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
    inputRef?: Ref<any>
    onChange?: (event: SyntheticEvent, value: any | Array<any>, reason: string, details?: string) => void
    voidLabel?: string
    voidValue?: string
    voidOption?: boolean
    value?: any
    onKeyDown?: any
}

const SelectForm = ({
  id,
  label,
  size = 4,
  options,
  optionValue,
  optionLabel,
  voidLabel = ' --- ',
  voidValue = '',
  voidOption,
  ...others
}: Props, ref: Ref<HTMLInputElement>) => (
    <Grid item md={size} xs={12}>
        <Stack spacing={1}>
            <InputLabel htmlFor={id}>{label}</InputLabel>
            <Autocomplete
                autoSelect
                options={[{ _id: 'test', name: 'Test' }]}
                getOptionLabel={(option) => option.name}
                id={id}
                fullWidth
                {...others}
                renderInput={(params: any) => (
                    <OutlinedInput
                        ref={ref}
                        sx={{ height: 40 }}
                        {...params} />)}
            />
        </Stack>
    </Grid>
)

export default forwardRef(SelectForm)
