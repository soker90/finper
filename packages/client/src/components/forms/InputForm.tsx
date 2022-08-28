import { FormHelperText, Grid, InputLabel, InputBaseComponentProps, OutlinedInput, Stack } from '@mui/material'
import { forwardRef, Ref } from 'react'

interface Props {
    id: string
    label: string
    placeholder?: string
    error: boolean
    errorText: string
    type?: string
    inputProps?: InputBaseComponentProps
    size?: number,
    defaultValue?: number | string
    autoFocus?: boolean
}

const InputForm = ({ id, label, errorText, size = 4, ...others }: Props, ref: Ref<HTMLInputElement>) => (
    <Grid item md={size} xs={12}>
        <Stack spacing={1}>
            <InputLabel htmlFor={id}>{label}</InputLabel>
            <OutlinedInput
                id={id}
                fullWidth
                ref={ref}
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

export default forwardRef(InputForm)
