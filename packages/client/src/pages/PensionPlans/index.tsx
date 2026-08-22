import React, { useState } from 'react'
import { Alert, Typography } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'

import { HeaderButtons } from 'components'
import { getId } from 'utils'
import { usePensionPlans, useAllPensionMovements, usePensionPlanMutate } from './hooks/usePensionPlans'
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

  const [openPlanModal, setOpenPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PensionPlan | null>(null)

  const [openMovementModal, setOpenMovementModal] = useState(false)
  const [activePlanForMovement, setActivePlanForMovement] = useState<PensionPlan | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<PensionTransaction | undefined>(undefined)

  const [actionError, setActionError] = useState<string | null>(null)

  const { movements, isLoading: loadingMovements, error: movementsError } = useAllPensionMovements()
  const recentMovements = movements.slice(0, 10)
  const planNameById = Object.fromEntries(pensionPlans.map((plan) => [getId(plan) ?? '', plan.name]))

  const triggerMutate = usePensionPlanMutate()

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
    const plan = pensionPlans.find((p) => getId(p) === transaction.planId)
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
          <Typography variant='subtitle1' sx={{ mt: 3, mb: 1 }}>Movimientos recientes</Typography>
          {movementsError && (
            <Alert severity='error' sx={{ mb: 2 }}>
              No se han podido cargar los movimientos recientes. Inténtalo de nuevo más tarde.
            </Alert>
          )}
          <PensionTransactionsTable
            transactions={loadingMovements ? [] : recentMovements}
            onEdit={handleEditMovement}
            planNameById={planNameById}
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
