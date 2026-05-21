import { ReactNode, useState } from 'react'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Modal,
  Typography
} from '@mui/material'

interface Props {
  /** Modal title */
  title: string
  /** Confirmation message — string or any ReactNode for rich content */
  description: ReactNode
  /** Label for the confirm button (default: 'Eliminar') */
  confirmLabel?: string
  /** Called when the user confirms — may be async; return value is ignored */
  onConfirm: () => Promise<unknown> | unknown
  onClose: () => void
  /** Extra content rendered below the description (e.g. API error messages) */
  extra?: ReactNode
  /** Align actions: 'end' (default) | 'between' */
  actionsAlign?: 'end' | 'between'
}

const ConfirmModal = ({
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  onClose,
  extra,
  actionsAlign = 'end'
}: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      onClose={onClose}
      open
      sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: 600, md: 800 },
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        outline: 'none'
      }}
      >
        <CardHeader title={title} />
        <Divider />
        <CardContent sx={{ overflowY: 'auto' }}>
          {typeof description === 'string'
            ? <Typography variant='h6' color='textSecondary'>{description}</Typography>
            : description}
          {extra}
        </CardContent>
        <Divider />
        <CardActions sx={{ p: 2, justifyContent: actionsAlign === 'between' ? 'space-between' : 'flex-end' }}>
          <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button color='error' variant='contained' disabled={isSubmitting} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </CardActions>
      </Card>
    </Modal>
  )
}

export default ConfirmModal
