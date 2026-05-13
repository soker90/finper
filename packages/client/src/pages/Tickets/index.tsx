import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  Button,
  Stack,
  Alert
} from '@mui/material'
import { useTickets } from 'hooks'
import { Ticket } from 'types'
import { format } from 'utils'
import ReviewModal from './components/ReviewModal'
import DeleteModal from './components/DeleteModal'

type ModalState =
  | { type: 'review'; data: Ticket }
  | { type: 'delete'; data: Ticket }

const Tickets = () => {
  const { tickets, ticketsEnabled, isLoading, error } = useTickets()
  const [activeModal, setActiveModal] = useState<ModalState | null>(null)
  const closeModal = () => setActiveModal(null)

  if (isLoading) return <Typography>Cargando tickets...</Typography>

  if (!ticketsEnabled) {
    return (
      <Alert severity='warning'>
        El módulo de tickets no está configurado en este servidor.
      </Alert>
    )
  }

  if (error) return <Alert severity='error'>Error al cargar tickets: {error.message}</Alert>

  return (
    <>
      <Typography variant='h4' mb={2}>Tickets pendientes</Typography>

      {tickets.length === 0 && (
        <Alert severity='info'>No hay tickets pendientes de revisión.</Alert>
      )}

      <Grid container spacing={2}>
        {tickets.map((ticket) => (
          <Grid key={ticket.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              {ticket.image_url && (
                <Box
                  component='img'
                  src={ticket.image_url}
                  alt='Ticket'
                  sx={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                  onClick={() => window.open(ticket.image_url!, '_blank')}
                />
              )}
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Typography variant='body2' color='text.secondary'>
                      {format.date(ticket.created_at) ?? '—'}
                    </Typography>
                    <Chip
                      label={ticket.status === 'pending' ? 'Pendiente' : 'Revisado'}
                      color={ticket.status === 'pending' ? 'warning' : 'success'}
                      size='small'
                    />
                  </Stack>

                  <Typography variant='h6'>{ticket.store ?? 'Comercio desconocido'}</Typography>

                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='body2' color='text.secondary'>Fecha ticket:</Typography>
                    <Typography variant='body2'>{ticket.date ? format.date(ticket.date) : '—'}</Typography>
                  </Stack>

                  <Stack direction='row' justifyContent='space-between'>
                    <Typography variant='body2' color='text.secondary'>Total:</Typography>
                    <Typography variant='body2' fontWeight='bold'>
                      {ticket.amount != null ? format.euro(ticket.amount) : '—'}
                    </Typography>
                  </Stack>

                  {ticket.payment_method && (
                    <Stack direction='row' justifyContent='space-between'>
                      <Typography variant='body2' color='text.secondary'>Pago:</Typography>
                      <Typography variant='body2'>{ticket.payment_method}</Typography>
                    </Stack>
                  )}

                  {!ticket.image_url && ticket.raw_text && (
                    <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic', wordBreak: 'break-word' }}>
                      "{ticket.raw_text}"
                    </Typography>
                  )}

                  <Stack direction='row' spacing={1} pt={1}>
                    <Button
                      variant='contained'
                      fullWidth
                      disabled={ticket.status === 'reviewed'}
                      onClick={() => setActiveModal({ type: 'review', data: ticket })}
                    >
                      {ticket.status === 'reviewed' ? 'Revisado' : 'Revisar'}
                    </Button>
                    <Button
                      variant='outlined'
                      color='error'
                      fullWidth
                      onClick={() => setActiveModal({ type: 'delete', data: ticket })}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {activeModal?.type === 'review' && (
        <ReviewModal
          ticket={activeModal.data}
          onClose={closeModal}
        />
      )}

      {activeModal?.type === 'delete' && (
        <DeleteModal
          ticket={activeModal.data}
          onClose={closeModal}
        />
      )}
    </>
  )
}

export default Tickets
