import { Button, Grid, IconButton, Stack, Typography } from '@mui/material'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { Control, FieldArrayWithId, FieldErrors, UseFormRegister } from 'react-hook-form'

import SelectGroupForm from './SelectGroupForm'
import InputForm from './InputForm'
import TagsInput from './TagsInput'

interface SplitLinesEditorProps {
  fields: FieldArrayWithId<any, 'splits', 'id'>[]
  categories: any[]
  availableTags: string[]
  control: Control<any>
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  remaining: number
  onAdd: () => void
  onRemove: (index: number) => void
  onAssignRemaining: () => void
  onDisableSplitMode: () => void
  categorySize?: number
  amountSize?: number
  tagsSize?: number
}

const SplitLinesEditor = ({
  fields,
  categories,
  availableTags,
  control,
  register,
  errors,
  remaining,
  onAdd,
  onRemove,
  onAssignRemaining,
  onDisableSplitMode,
  categorySize = 4,
  amountSize = 3,
  tagsSize = 4
}: SplitLinesEditorProps) => (
  <Stack spacing={2}>
    <Stack direction='row' spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant='subtitle2'>Desglose</Typography>
      <Button variant='text' color='inherit' onClick={onDisableSplitMode}>Quitar división</Button>
    </Stack>
    {fields.map((field, index) => (
      <Grid container spacing={2} key={field.id} sx={{ alignItems: 'center' }}>
        <SelectGroupForm
          id={`splits.${index}.category`} label='Categoria'
          options={categories}
          optionValue='_id'
          optionLabel='name'
          error={!!(errors.splits as any)?.[index]?.category}
          {...register(`splits.${index}.category`, { required: true })}
          errorText='Introduce una categoria válida'
          size={categorySize}
        />
        <InputForm
          id={`splits.${index}.amount`} label='Importe' placeholder='0'
          error={!!(errors.splits as any)?.[index]?.amount}
          {...register(`splits.${index}.amount`, { required: true, valueAsNumber: true })}
          errorText='Introduce un importe'
          type='number' inputProps={{ step: 'any' }}
          size={amountSize}
        />
        <TagsInput
          name={`splits.${index}.tags`}
          control={control}
          availableTags={availableTags}
          label='Etiquetas'
          size={tagsSize}
        />
        <Grid size={{ xs: 12, md: 1 }}>
          <IconButton
            aria-label='Eliminar línea'
            color='error'
            disabled={fields.length <= 2}
            onClick={() => onRemove(index)}
          >
            <DeleteOutlined />
          </IconButton>
        </Grid>
      </Grid>
    ))}
    <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
      <Button variant='outlined' startIcon={<PlusOutlined />} onClick={onAdd}>
        Añadir categoría
      </Button>
      <Button variant='text' onClick={onAssignRemaining}>Asignar resto</Button>
      <Typography variant='body2' color={remaining === 0 ? 'success.main' : 'error.main'}>
        Restante: {remaining.toFixed(2)} €
      </Typography>
    </Stack>
  </Stack>
)

export default SplitLinesEditor
