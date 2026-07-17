import React from 'react'
import { Typography } from '@mui/material'
import { Yield } from 'types'
import { ConfirmModal } from 'components'

interface Props {
  item: Yield
  onClose: () => void
  onConfirm: () => Promise<unknown> | unknown
}

const TYPE_LABEL: Record<string, string> = {
  interest: 'Remunerada',
  cashback: 'de Cashback'
}

const YieldRemoveModal = ({ item, onClose, onConfirm }: Props) => {
  return (
    <ConfirmModal
      title='¿Quieres borrar el rendimiento?'
      description={
        <Typography variant='h6' color='textSecondary'>
          ¿Seguro que quieres eliminar el rendimiento <b>{TYPE_LABEL[item.type] ?? item.type}</b> de la cuenta <b>{item.account?.name}</b>?
          Se borrarán también todas sus liquidaciones y movimientos enlazados. Esta acción no se puede deshacer.
        </Typography>
      }
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}

export default YieldRemoveModal
