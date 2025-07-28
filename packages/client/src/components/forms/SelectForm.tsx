import {
  FormHelperText,
  Grid,
  InputLabel,
  OutlinedInput,
  Stack,
  NativeSelect
} from '@mui/material'
import { ChangeEvent, forwardRef, Ref } from 'react'
import type { NativeSelectInputProps } from '@mui/material/NativeSelect/NativeSelectInput'

interface Props {
  id: string
  label: string
  placeholder?: string
  error?: boolean
  errorText?: string
  type?: string
  inputProps?: NativeSelectInputProps
  size?: number
  helperText?: string
  options: any[]
  optionValue: string | number
  optionLabel: string | number
  inputRef?: Ref<any>
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
  voidLabel?: string
  voidValue?: string
  voidOption?: boolean
  value?: any
  defaultValue?: string
}

const SelectForm = ({
  id,
  label,
  size = 4,
  errorText,
  helperText,
  options,
  optionValue,
  optionLabel,
  voidLabel = ' --- ',
  voidValue = '',
  voidOption,
  ...others
}: Props, ref: Ref<HTMLInputElement>) => (
  <Grid size={{ md: size, xs: 12 }}>
    <Stack spacing={1}>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <NativeSelect
        id={id}
        fullWidth
        input={<OutlinedInput />}
        inputRef={ref}
        {...others}
      >
        {voidOption && <option value={voidValue}>{voidLabel}</option>}
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
