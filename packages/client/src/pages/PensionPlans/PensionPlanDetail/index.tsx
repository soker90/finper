import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Box, Button, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

import { HeaderButtons } from 'components'
import { usePensionPlanDetail, usePensionPlanMovements, usePensionPlanMutate } from '../hooks'
import { PensionStatCard, PensionTransactionsTable, ModalPensionPlan, TransactionModal } from '../components'
import { STATS } from '../constants'
import { deletePensionPlan, deletePensionMovement } from 'services/apiService'
import type { PensionTransaction } from 'types'

const PensionPlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { pensionPlan, isLoading: loadingPlan } = usePensionPlanDetail(id)
  const { movements, isLoading: loadingMovements } = usePensionPlanMovements(id)
  const triggerMutate = usePensionPlanMutate(id)

  const [openPlanModal, setOpenPlanModal] = useState(false)
  const [openMovementModal, setOpenMovementModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<PensionTransaction | undefined>(undefined)

  if (!id) {
    navigate('/pensiones', { replace: true })
    return null
  }

  if (loadingPlan) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!pensionPlan) {
    return (
      <Typography color='textSecondary' sx={{ mt: 4, textAlign: 'center' }}>
        Plan de pensiones no encontrado.
      </Typography>
    )
  }

  const handleOpenAddMovement = () => {
    setEditingTransaction(undefined)
    setOpenMovementModal(true)
  }

  const handleEditMovement = (transaction: PensionTransaction) => {
    setEditingTransaction(transaction)
    setOpenMovementModal(true)
  }

  const handleDeleteMovement = async (transaction: PensionTransaction) => {
    if (!transaction._id) return
    if (window.confirm('¿Estás seguro de eliminar este movimiento?')) {
      const { error } = await deletePensionMovement(id, transaction._id)
      if (!error) triggerMutate()
    }
  }

  const handleDeletePlan = async () => {
    if (window.confirm(`¿Estás seguro de eliminar el plan "${pensionPlan.name}"? Se eliminarán también todos sus movimientos.`)) {
      const { error } = await deletePensionPlan(id)
      if (!error) navigate('/pensiones')
    }
  }

  const actionButtons = [
    { Icon: PlusOutlined, title: 'Movimiento', onClick: handleOpenAddMovement },
    { Icon: EditOutlined, title: 'Editar', onClick: () => setOpenPlanModal(true) },
    { Icon: DeleteOutlined, title: 'Eliminar', onClick: handleDeletePlan }
  ]

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowLeftOutlined />} onClick={() => navigate('/pensiones')} size='small'>
            Volver
          </Button>
          <Typography variant='h4'>{pensionPlan.name}</Typography>
        </Box>
        <HeaderButtons buttons={actionButtons} desktopSx={{}} />
      </Box>

      <Grid container spacing={3}>
        {STATS.map((stat) => (
          <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={stat.title}>
            <PensionStatCard title={stat.title} amount={pensionPlan[stat.value]} currency={stat.currency} />
          </Grid>
        ))}
      </Grid>

      <PensionTransactionsTable
        transactions={loadingMovements ? [] : movements}
        onEdit={handleEditMovement}
        onDelete={handleDeleteMovement}
      />

      <ModalPensionPlan
        open={openPlanModal}
        onClose={() => setOpenPlanModal(false)}
        pensionPlan={pensionPlan}
        onSuccess={triggerMutate}
      />

      {openMovementModal && (
        <TransactionModal
          planId={id}
          transaction={editingTransaction}
          onClose={() => setOpenMovementModal(false)}
        />
      )}
    </Stack>
  )
}

export default PensionPlanDetail
