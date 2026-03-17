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
      sx={{ maxWidth: 800, margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card>
        <CardHeader title='¿Quieres borrar el ticket?' />
        <Divider />
        <CardContent>
          <Typography variant='h6' color='textSecondary'>
            ¿Seguro que quieres eliminar el ticket de <b>{ticket.store ?? 'este comercio'}</b> por importe de <b>{ticket.amount != null ? format.euro(ticket.amount) : '—'}</b>?
            Se borrará también la foto. Esta acción no se puede deshacer.
          </Typography>
        </CardContent>
        <Divider />
        <CardActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button color='error' variant='contained' onClick={handleDelete}>Eliminar</Button>
        </CardActions>
      </Card>
    </Modal>
  )
}

export default DeleteModal
