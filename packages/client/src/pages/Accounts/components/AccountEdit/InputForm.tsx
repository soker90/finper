import { FormHelperText, Grid, InputLabel, InputBaseComponentProps, OutlinedInput, Stack } from '@mui/material'
import { forwardRef, Ref } from 'react'

interface Props {
    id: string
    label: string
    placeholder: string
    error: boolean
    errorText: string
    type?: string
    inputProps?: InputBaseComponentProps
}

const InputForm = ({ id, label, errorText, ...others }: Props, ref: Ref<HTMLInputElement>) => (
    <Grid size={{ md: 4, xs: 12 }}>
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
