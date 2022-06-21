import {
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Stack,
  NativeSelect
} from '@mui/material'
import { forwardRef, Ref } from 'react'
import { NativeSelectInputProps } from '@mui/material/NativeSelect/NativeSelectInput'

interface Props {
    id: string
    label: string
    placeholder?: string
    error: boolean
    errorText: string
    type?: string
    inputProps?: NativeSelectInputProps
    size?: number
    helperText?: string
    options: any[]
    optionValue: string | number
    optionLabel: string | number
    inputRef?: Ref<any>
}

const SelectForm = ({ id, label, size = 4, errorText, helperText, options, optionValue, optionLabel, ...others }: Props, ref: Ref<HTMLInputElement>) => (
    <Grid item md={size} xs={12}>
        <Stack spacing={1}>
            <InputLabel htmlFor={id}>{label}</InputLabel>
            <NativeSelect
                id={id}
                fullWidth
                defaultValue={30}
                input={<OutlinedInput />}
                inputRef={ref}
                {...others}
            >
                {options.map((option: any) => (
                    <option key={option[optionValue]} value={option[optionValue]}>
                        {option[optionLabel]}
                    </option>
                ))}
            </NativeSelect>
            <FormHelperText>{helperText}</FormHelperText>

            {others.error && (
                <FormHelperText error>
                    {errorText}
                </FormHelperText>
            )}
        </Stack>
    </Grid>
)

export default forwardRef(SelectForm)