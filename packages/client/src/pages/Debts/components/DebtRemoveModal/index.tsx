import { mutate } from 'swr'
import { Button, Card, CardActions, CardContent, CardHeader, Divider, Modal, Typography } from '@mui/material'

import { DEBTS } from 'constants/api-paths'
import { deleteDebt } from 'services/apiService'
import { Debt } from 'types'

import './style.module.css'

const DebtRemoveModal = ({
  debt,
  onClose
}: { debt: Debt, onClose: () => void }) => {
  const handleDeleteButton = async () => {
    await deleteDebt(debt._id as string)
    onClose()
    // @ts-ignore
    await mutate(DEBTS, async (debts: Debt[]) => {
      return debts.filter(d => d._id !== debt?._id)
    })
  }

  return (
    <Modal
      onClose={onClose}
      open
      sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card sx={{ width: '100%', maxWidth: { xs: '100%', sm: 600, md: 800 }, maxHeight: '100%', display: 'flex', flexDirection: 'column', outline: 'none' }}>
        <CardHeader title='¿Quieres borrar la deuda?' />
        <Divider />
        <CardContent sx={{ overflowY: 'auto' }}>
          <Typography variant='h6' color='textSecondary'>
            ¿Seguro que quieres eliminar la deuda de {debt.from} por un importe de {debt.amount}€?
          </Typography>
        </CardContent>
        <Divider />
        <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button color='error' variant='contained' onClick={handleDeleteButton}>Eliminar</Button>
        </CardActions>
      </Card>
    </Modal>
  )
}

export default DebtRemoveModal
