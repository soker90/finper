import { Typography } from '@mui/material'

import { useTickets } from 'hooks'
import { Ticket } from 'types'
import { format } from 'utils'
import { ConfirmModal } from 'components'

const DeleteModal = ({
  ticket,
  onClose
}: { ticket: Ticket, onClose: () => void }) => {
  const { removeTicket } = useTickets()

  const handleConfirm = async () => {
    await removeTicket(ticket.id)
    onClose()
  }

  return (
    <ConfirmModal
      title='¿Quieres borrar el ticket?'
      description={
        <Typography variant='h6' color='textSecondary'>
          ¿Seguro que quieres eliminar el ticket de <b>{ticket.store ?? 'este comercio'}</b> por importe de <b>{ticket.amount != null ? format.euro(ticket.amount) : '—'}</b>?
          Se borrará también la foto. Esta acción no se puede deshacer.
        </Typography>
      }
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  )
}

export default DeleteModal
