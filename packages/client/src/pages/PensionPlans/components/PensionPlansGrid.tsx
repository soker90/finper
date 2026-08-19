import React from 'react'
import { Box, Grid, CircularProgress, Alert } from '@mui/material'
import { getId } from 'utils'
import { PensionPlanCard } from './PensionPlanCard'
import type { PensionPlan } from 'types'

interface PensionPlansGridProps {
  pensionPlans: PensionPlan[]
  isLoading: boolean
  onAddPlan: () => void
  onOpenDetail: (plan: PensionPlan) => void
  onAddMovement: (plan: PensionPlan) => void
  onEdit: (plan: PensionPlan) => void
  onDelete: (plan: PensionPlan) => void
}

export const PensionPlansGrid: React.FC<PensionPlansGridProps> = ({
  pensionPlans,
  isLoading,
  onAddPlan,
  onOpenDetail,
  onAddMovement,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (pensionPlans.length === 0) {
    return (
      <Alert severity='info' sx={{ cursor: 'pointer', mb: 3 }} onClick={onAddPlan}>
        No tienes ningún plan de pensiones registrado. Pulsa "Nuevo Plan" para añadir el primero.
      </Alert>
    )
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {pensionPlans.map((plan) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={getId(plan)}>
          <PensionPlanCard
            plan={plan}
            onOpenDetail={onOpenDetail}
            onAddMovement={onAddMovement}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Grid>
      ))}
    </Grid>
  )
}
