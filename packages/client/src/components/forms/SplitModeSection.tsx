import { Button } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import type { Control, FieldArrayWithId, FieldErrors, UseFormRegister } from 'react-hook-form'

import SplitLinesEditor from './SplitLinesEditor'

interface SplitModeSectionProps {
  splitMode: boolean
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
  onEnableSplitMode: () => void
  onDisableSplitMode: () => void
  categorySize?: number
  amountSize?: number
  tagsSize?: number
}

/** Bloque compartido por TransactionEdit, CreditCardMovementEdit y
 * ModalMovement: alterna entre el botón "Dividir movimiento" y el editor de
 * líneas de desglose. */
const SplitModeSection = ({
  splitMode,
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
  onEnableSplitMode,
  onDisableSplitMode,
  categorySize,
  amountSize,
  tagsSize
}: SplitModeSectionProps) => (
  !splitMode
    ? (
      <Button variant='outlined' startIcon={<PlusOutlined />} onClick={onEnableSplitMode}>
        Dividir movimiento
      </Button>
      )
    : (
      <SplitLinesEditor
        fields={fields}
        categories={categories}
        availableTags={availableTags}
        control={control}
        register={register}
        errors={errors}
        remaining={remaining}
        onAdd={onAdd}
        onRemove={onRemove}
        onAssignRemaining={onAssignRemaining}
        onDisableSplitMode={onDisableSplitMode}
        categorySize={categorySize}
        amountSize={amountSize}
        tagsSize={tagsSize}
      />
      )
)

export default SplitModeSection
