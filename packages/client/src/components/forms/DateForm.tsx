import { FormHelperText, Grid, InputBaseComponentProps, InputLabel, Stack } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller } from 'react-hook-form'
import dayjs from 'dayjs'

interface Props {
  id: string
  label: string
  placeholder: string
  error: boolean
  errorText?: string
  type?: string
  inputProps?: InputBaseComponentProps,
  value?: string
  onChange?: any
  control: any
  size?: number
}

const DateForm = ({ id, label, control, error, errorText, size = 4, ...others }: Props) => (
  <Grid size={{ md: size, xs: 12 }}>
    <Stack spacing={1}>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <Controller
        name={id}
        control={control}
        rules={{ required: true }}
        render={({ field }) => {
          const { onChange } = field
          return (
            <DatePicker
              slotProps={{
                textField: {
                  variant: 'outlined',
                  error
                },
                field: {
                  sx: {
                    '& .MuiPickersSectionList-root': {
                      padding: '10.5px 14px'
                    }
                  }
                }
              }}
              onChange={onChange}
              format='DD/MM/YYYY'
              {...(field.value && { value: dayjs(field.value) })}
              {...others}
            />
          )
        }}
      />
      {error && (
        <FormHelperText error>
          {errorText}
        </FormHelperText>
      )}
    </Stack>
  </Grid>
)

export default DateForm
