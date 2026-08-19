import React, { useState } from 'react'
import {
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack
} from '@mui/material'
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FundOutlined
} from '@ant-design/icons'
import { MainCard } from 'components'
import { format } from 'utils'
import type { PensionPlan } from 'types'

interface PensionPlanCardProps {
  plan: PensionPlan
  onOpenDetail: (plan: PensionPlan) => void
  onAddMovement: (plan: PensionPlan) => void
  onEdit: (plan: PensionPlan) => void
  onDelete: (plan: PensionPlan) => void
}

export const PensionPlanCard: React.FC<PensionPlanCardProps> = ({
  plan,
  onOpenDetail,
  onAddMovement,
  onEdit,
  onDelete
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const openMenu = Boolean(anchorEl)

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  return (
    <MainCard
      onClick={() => onOpenDetail(plan)}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Stack direction='row' sx={{ alignItems: 'center', gap: 1 }}>
          <FundOutlined style={{ fontSize: 24 }} />
          <Typography variant='h5' sx={{ fontWeight: 700 }}>
            {plan.name}
          </Typography>
        </Stack>
        <IconButton onClick={handleMenuOpen} size='small' aria-label={`Acciones de ${plan.name}`}>
          <MoreOutlined style={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      <Box sx={{ my: 2 }}>
        <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          Valor actual
        </Typography>
        <Typography variant='h3' sx={{ fontWeight: 800, mt: 0.5 }}>
          {format.euro(plan.total)}
        </Typography>
      </Box>

      <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant='caption' color='text.secondary'>
          Aportado: <strong>{format.euro(plan.amount)}</strong>
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          Unidades: <strong>{format.number(plan.units, { maximumFractionDigits: 5 })}</strong>
        </Typography>
      </Stack>

      <Stack direction='row' spacing={1.5} sx={{ mt: 3 }}>
        <Button
          variant='outlined'
          size='small'
          startIcon={<PlusOutlined />}
          onClick={(e) => { e.stopPropagation(); onAddMovement(plan) }}
          fullWidth
        >
          Movimiento
        </Button>
      </Stack>

      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose} onClick={(e) => e.stopPropagation()}>
        <MenuItem
          onClick={() => {
            handleMenuClose()
            onEdit(plan)
          }}
        >
          <EditOutlined style={{ marginRight: 8 }} /> Editar plan
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose()
            onDelete(plan)
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlined style={{ marginRight: 8 }} /> Eliminar plan
        </MenuItem>
      </Menu>
    </MainCard>
  )
}
