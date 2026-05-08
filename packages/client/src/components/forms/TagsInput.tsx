import { Autocomplete, Chip, Grid, InputLabel, Stack, TextField } from '@mui/material'
import { Control, Controller } from 'react-hook-form'
import { sanitizeTag } from 'utils'

interface TagsInputProps {
  name: string
  control: Control<any>
  availableTags: string[]
  label?: string
  size?: number
}

const TagsInput = ({ name, control, availableTags, label = 'Etiquetas', size = 4 }: TagsInputProps) => {
  return (
    <Grid size={{ md: size, xs: 12 }}>
      <Stack spacing={1}>
        <InputLabel htmlFor={name}>{label}</InputLabel>
        <Controller
          name={name}
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <Autocomplete
              multiple
              freeSolo
              options={availableTags}
              value={field.value || []}
              onChange={(_, newValue) => {
                const sanitized = newValue
                  .map((v: string) => typeof v === 'string' ? sanitizeTag(v) : v)
                  .filter(Boolean)
                field.onChange([...new Set(sanitized)])
              }}
              renderTags={(value: readonly string[], getTagProps) =>
                value.map((option: string, index: number) => {
                  const { key, ...tagProps } = getTagProps({ index })
                  return (
                    <Chip
                      key={key}
                      variant='outlined'
                      label={option}
                      size='small'
                      {...tagProps}
                    />
                  )
                })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  id={name}
                  placeholder={field.value?.length ? '' : 'Añadir etiqueta con intro'}
                />
              )}
            />
          )}
        />
      </Stack>
    </Grid>
  )
}

export default TagsInput
