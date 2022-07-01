import {
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Stack,
  NativeSelect, Autocomplete, TextField
} from '@mui/material'
import { ChangeEvent, forwardRef, Ref } from 'react'

interface Props {
    id: string
    label: string
    placeholder?: string
    size?: number
    options: any[]
    optionValue: string | number
    optionLabel: string | number
    inputRef?: Ref<any>
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    voidLabel?: string
    voidValue?: string
    voidOption?: boolean
    value?: any
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
                options={[{ _id: 'test', name: 'Test' }]}
                getOptionLabel={(option) => option.name}
                clearOnEscape
                id={id}
                fullWidth
                {...others}
                renderInput={(params) => (
                    <OutlinedInput
                        ref={ref}
                        {...params} />)}
            />
        </Stack>
    </Grid>
)

export default forwardRef(SelectForm)
