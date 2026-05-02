import { Button, Card, CardActions, CardContent, CardHeader, Divider, Modal, Typography } from '@mui/material'

type Props = {
  title: string
  description: string
  onClose: () => void
  onConfirm: () => void
}

const RemoveModal = ({ title, description, onClose, onConfirm }: Props) => {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <Modal
      onClose={onClose}
      open
      sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card sx={{ width: '100%', maxWidth: { xs: '100%', sm: 600, md: 800 }, maxHeight: '100%', display: 'flex', flexDirection: 'column', outline: 'none' }}>
        <CardHeader title={title} />
        <Divider />
        <CardContent sx={{ overflowY: 'auto' }}>
          <Typography variant='h6' color='textSecondary'>
            {description}
          </Typography>
        </CardContent>
        <Divider />
        <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button color='error' variant='contained' onClick={handleConfirm}>Eliminar</Button>
        </CardActions>
      </Card>
    </Modal>
  )
}

export default RemoveModal
