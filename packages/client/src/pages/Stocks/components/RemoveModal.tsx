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
      sx={{ maxWidth: 800, margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card>
        <CardHeader title={title} />
        <Divider />
        <CardContent>
          <Typography variant='h6' color='textSecondary'>
            {description}
          </Typography>
        </CardContent>
        <Divider />
        <CardActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button color='error' variant='contained' onClick={handleConfirm}>Eliminar</Button>
        </CardActions>
      </Card>
    </Modal>
  )
}

export default RemoveModal
