import { Grid, InputBaseComponentProps, InputLabel, Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'

interface Props {
    id: string
    label: string
    placeholder: string
    error: boolean
    type?: string
    inputProps?: InputBaseComponentProps,
    value?: string
    onChange?: any
    control: any
    size?: number
}

const DateForm = ({ id, label, control, error, size = 2, ...others }: Props) => (
    <Grid item md={size} xs={12}>
        <Stack spacing={1}>
            <InputLabel htmlFor={id}>{label}</InputLabel>
            <Controller
                name={id}
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                    <DatePicker
                        renderInput={(params) =>
                            <TextField variant='outlined'
                                       error={error}
                                       {...params} />}
                        value={field.value}
                        onChange={field.onChange}
                        inputFormat="DD/MM/YYYY"
                        okLabel='Aceptar'
                        clearLabel="Futa"
                        cancelLabel="Hairisha"
                        {...others} />
                )}
            />
        </Stack>
    </Grid>
)

export default DateForm
