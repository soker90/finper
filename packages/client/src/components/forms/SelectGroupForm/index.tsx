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

import OptionGroup from './OptionGroup'

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
  childrenName?: string
  value?: any
}

const SelectGroupForm = ({
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
  childrenName = 'children',
  ...others
}: Props, ref: Ref<HTMLInputElement>) => (
  <Grid size={{ md: size, xs: 12 }}>
    <Stack spacing={1}>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <NativeSelect
        id={id}
        fullWidth
        defaultValue=''
        input={<OutlinedInput />}
        inputRef={ref}
        {...others}
      >
        {voidOption && <option value={voidValue}>{voidLabel}</option>}
        {options.map((option: any) => (
          <OptionGroup
            key={option[optionValue]} optionValue={optionValue} optionLabel={optionLabel}
            option={option} childrenName={childrenName}
          />
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

export default forwardRef(SelectGroupForm)
