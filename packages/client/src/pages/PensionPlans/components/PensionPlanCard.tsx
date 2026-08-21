import React, { useState } from 'react'
import {
  Typography,
  Box,
  Button,
  Chip,
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
  FundOutlined,
  RiseOutlined,
  FallOutlined
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
  const returnPct = plan.amount > 0 ? ((plan.total - plan.amount) / plan.amount) * 100 : null
  // Plans created before the color picker existed have no color set.
  const color = plan.color ?? '#607D8B'

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
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <FundOutlined style={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 700 }}>
            {plan.name}
          </Typography>
        </Stack>
        <IconButton onClick={handleMenuOpen} size='small' aria-label={`Acciones de ${plan.name}`}>
          <MoreOutlined style={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      <Box sx={{ my: 2 }}>
        <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
            Valor actual
          </Typography>
          {returnPct !== null && (
            <Chip
              size='small'
              icon={returnPct >= 0
                ? <RiseOutlined style={{ fontSize: '0.75rem' }} />
                : <FallOutlined style={{ fontSize: '0.75rem' }} />}
              label={`${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%`}
              color={returnPct >= 0 ? 'success' : 'error'}
            />
          )}
        </Stack>
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
