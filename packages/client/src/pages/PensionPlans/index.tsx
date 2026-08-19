import React, { useState } from 'react'
import { Alert, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'

import { HeaderButtons } from 'components'
import { getId } from 'utils'
import { usePensionPlans, usePensionPlanMovements, usePensionPlanMutate } from './hooks'
import {
  PensionPlansSummary,
  PensionPlansGrid,
  PensionTransactionsTable,
  ModalPensionPlan,
  TransactionModal
} from './components'
import { deletePensionPlan } from 'services/apiService'
import type { PensionPlan, PensionTransaction } from 'types'

const PensionPlansPage: React.FC = () => {
  const navigate = useNavigate()
  const { pensionPlans, isLoading: loadingPlans, error: plansError } = usePensionPlans()
  const [selectedPlanIdFilter, setSelectedPlanIdFilter] = useState<string>('')

  const [openPlanModal, setOpenPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PensionPlan | null>(null)

  const [openMovementModal, setOpenMovementModal] = useState(false)
  const [activePlanForMovement, setActivePlanForMovement] = useState<PensionPlan | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<PensionTransaction | undefined>(undefined)

  const [actionError, setActionError] = useState<string | null>(null)

  const activePlanIdForMovements = selectedPlanIdFilter || (pensionPlans.length > 0 ? getId(pensionPlans[0]) ?? '' : '')

  const { movements, isLoading: loadingMovements } = usePensionPlanMovements(activePlanIdForMovements)
  const recentMovements = movements.slice(0, 10)

  const triggerMutate = usePensionPlanMutate(activePlanIdForMovements)

  const totalContributed = pensionPlans.reduce((acc, p) => acc + (p.amount ?? 0), 0)
  const totalValue = pensionPlans.reduce((acc, p) => acc + (p.total ?? 0), 0)

  const handleOpenDetail = (plan: PensionPlan) => {
    const id = getId(plan)
    if (id) navigate(`/pensiones/${id}`)
  }

  const handleOpenAddPlan = () => {
    setEditingPlan(null)
    setOpenPlanModal(true)
  }

  const handleOpenEditPlan = (plan: PensionPlan) => {
    setEditingPlan(plan)
    setOpenPlanModal(true)
  }

  const handleDeletePlan = async (plan: PensionPlan) => {
    if (window.confirm(`¿Estás seguro de eliminar el plan "${plan.name}"? Se eliminarán también todos sus movimientos.`)) {
      const id = getId(plan)
      if (!id) return
      const { error } = await deletePensionPlan(id)
      if (error) {
        setActionError(error)
        return
      }
      setActionError(null)
      triggerMutate()
    }
  }

  const handleOpenAddMovement = (plan: PensionPlan) => {
    setActivePlanForMovement(plan)
    setEditingTransaction(undefined)
    setOpenMovementModal(true)
  }

  const handleEditMovement = (transaction: PensionTransaction) => {
    const plan = pensionPlans.find((p) => getId(p) === activePlanIdForMovements)
    if (!plan) return
    setActivePlanForMovement(plan)
    setEditingTransaction(transaction)
    setOpenMovementModal(true)
  }

  return (
    <>
      <HeaderButtons
        buttons={[
          { Icon: PlusOutlined, title: 'Nuevo Plan', onClick: handleOpenAddPlan }
        ]}
        desktopSx={{ marginTop: -7 }}
      />

      {plansError && (
        <Alert severity='error' sx={{ mb: 3 }}>
          No se han podido cargar los planes de pensiones. Inténtalo de nuevo más tarde.
        </Alert>
      )}

      {actionError && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <PensionPlansSummary
        totalPlans={pensionPlans.length}
        totalContributed={totalContributed}
        totalValue={totalValue}
      />

      <PensionPlansGrid
        pensionPlans={pensionPlans}
        isLoading={loadingPlans}
        onAddPlan={handleOpenAddPlan}
        onOpenDetail={handleOpenDetail}
        onAddMovement={handleOpenAddMovement}
        onEdit={handleOpenEditPlan}
        onDelete={handleDeletePlan}
      />

      {pensionPlans.length > 0 && (
        <>
          <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', mt: 3, mb: 1 }}>
            <Typography variant='subtitle1'>Movimientos recientes</Typography>
            <TextField
              select
              size='small'
              label='Plan'
              value={activePlanIdForMovements}
              onChange={(event) => setSelectedPlanIdFilter(event.target.value)}
              sx={{ minWidth: 200 }}
            >
              {pensionPlans.map((plan) => (
                <MenuItem key={getId(plan)} value={getId(plan)}>
                  {plan.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <PensionTransactionsTable
            transactions={loadingMovements ? [] : recentMovements}
            onEdit={handleEditMovement}
          />
        </>
      )}

      <ModalPensionPlan
        open={openPlanModal}
        onClose={() => setOpenPlanModal(false)}
        pensionPlan={editingPlan}
        onSuccess={triggerMutate}
      />

      {activePlanForMovement && openMovementModal && (
        <TransactionModal
          planId={getId(activePlanForMovement) ?? ''}
          transaction={editingTransaction}
          onClose={() => setOpenMovementModal(false)}
        />
      )}
    </>
  )
}

export default PensionPlansPage
