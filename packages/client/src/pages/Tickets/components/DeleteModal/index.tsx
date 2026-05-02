import { Button, Card, CardActions, CardContent, CardHeader, Divider, Modal, Typography } from '@mui/material'

import { useTickets } from 'hooks'
import { Ticket } from 'types'
import { format } from 'utils'

const DeleteModal = ({
  ticket,
  onClose
}: { ticket: Ticket, onClose: () => void }) => {
  const { removeTicket } = useTickets()

  const handleDelete = async () => {
    await removeTicket(ticket.id)
    onClose()
  }

  return (
    <Modal
      onClose={onClose}
      open
      sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card sx={{ width: '100%', maxWidth: { xs: '100%', sm: 600, md: 800 }, maxHeight: '100%', display: 'flex', flexDirection: 'column', outline: 'none' }}>
        <CardHeader title='¿Quieres borrar el ticket?' />
        <Divider />
        <CardContent sx={{ overflowY: 'auto' }}>
          <Typography variant='h6' color='textSecondary'>
            ¿Seguro que quieres eliminar el ticket de <b>{ticket.store ?? 'este comercio'}</b> por importe de <b>{ticket.amount != null ? format.euro(ticket.amount) : '—'}</b>?
            Se borrará también la foto. Esta acción no se puede deshacer.
          </Typography>
        </CardContent>
        <Divider />
        <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button color='error' variant='contained' onClick={handleDelete}>Eliminar</Button>
        </CardActions>
      </Card>
    </Modal>
  )
}

export default DeleteModal
