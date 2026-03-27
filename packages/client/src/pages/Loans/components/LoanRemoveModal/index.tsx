import { useState } from 'react'
import { Button, Card, CardActions, CardContent, CardHeader, Divider, Modal, Typography } from '@mui/material'
import { mutate } from 'swr'

import { LOANS } from 'constants/api-paths'
import { deleteLoan } from 'services/apiService'
import { Loan } from 'types'

interface Props {
  loan: Loan
  onClose: () => void
}

const LoanRemoveModal = ({ loan, onClose }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteLoan(loan._id)
    onClose()
    // @ts-ignore
    await mutate(LOANS, async (loans: Loan[]) => loans.filter(l => l._id !== loan._id))
  }

  return (
    <Modal
      onClose={onClose}
      open
      sx={{ maxWidth: 800, margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card>
        <CardHeader title='¿Quieres borrar el préstamo?' />
        <Divider />
        <CardContent>
          <Typography variant='h6' color='textSecondary'>
            ¿Seguro que quieres eliminar el préstamo <b>{loan.name}</b>?
            Se borrarán también todos los pagos y eventos asociados. Esta acción no se puede deshacer.
          </Typography>
        </CardContent>
        <Divider />
        <CardActions>
          <Button onClick={onClose} disabled={isDeleting}>Cancelar</Button>
          <Button color='error' variant='contained' disabled={isDeleting} onClick={handleDelete}>Eliminar</Button>
        </CardActions>
      </Card>
    </Modal>
  )
}

export default LoanRemoveModal
