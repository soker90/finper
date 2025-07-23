import { Grid, InputBaseComponentProps, InputLabel, Stack } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'

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
    <Grid size={{ md: size, xs: 12 }}>
        <Stack spacing={1}>
            <InputLabel htmlFor={id}>{label}</InputLabel>
            <Controller
                name={id}
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                    <DatePicker
                        slotProps={{
                          textField: {
                            variant: 'outlined',
                            error
                          }
                        }}
                        onChange={field.onChange}
                        format="DD/MM/YYYY"
                        {...(field.value && { value: dayjs(field.value) })}
                        {...others} />
                )}
            />
        </Stack>
    </Grid>
)

export default DateForm
