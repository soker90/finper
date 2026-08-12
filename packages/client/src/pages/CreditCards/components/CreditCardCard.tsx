import React, { useState } from 'react'
import {
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack
} from '@mui/material'
import {
  PlusOutlined,
  DollarOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined
} from '@ant-design/icons'
import { MainCard } from 'components'
import { format } from 'utils'
import type { CreditCard } from 'types'

interface CreditCardCardProps {
  card: CreditCard
  index: number
  onAddMovement: (card: CreditCard) => void
  onPayDebt: (card: CreditCard) => void
  onEdit: (card: CreditCard) => void
  onDelete: (card: CreditCard) => void
}

export const CreditCardCard: React.FC<CreditCardCardProps> = ({
  card,
  onAddMovement,
  onPayDebt,
  onEdit,
  onDelete
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const openMenu = Boolean(anchorEl)

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const currentDebt = card.currentDebt ?? 0
  const limit = card.limit
  const hasLimit = limit !== null && limit !== undefined && limit > 0

  const usagePercent = hasLimit ? Math.min(100, Math.round((currentDebt / limit) * 100)) : 0
  const availableCredit = hasLimit ? Math.max(0, limit - currentDebt) : null

  return (
    <MainCard
      sx={{
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Header: Card Name, Chip graphic & Overflow Menu */}
      <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Stack direction='row' sx={{ alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 22,
              borderRadius: 1,
              bgcolor: 'warning.main',
              border: '1px solid',
              borderColor: 'warning.dark',
              display: 'inline-block'
            }}
          />
          <Typography variant='h5' sx={{ fontWeight: 700 }}>
            {card.name}
          </Typography>
        </Stack>
        <IconButton onClick={handleMenuOpen} size='small' aria-label={`Acciones de ${card.name}`}>
          <MoreOutlined style={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      {/* Associated Bank Account Badge */}
      {card.account && (
        <Stack direction='row' sx={{ alignItems: 'center', gap: 0.75, mb: 2 }}>
          <BankOutlined style={{ fontSize: 13 }} />
          <Typography variant='caption' color='text.secondary'>
            Cobro en: <strong>{card.account.name}</strong> ({card.account.bank})
          </Typography>
        </Stack>
      )}

      {/* Current Accumulated Debt Display */}
      <Box sx={{ my: 2 }}>
        <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          Deuda acumulada
        </Typography>
        <Typography
          variant='h3'
          sx={{
            fontWeight: 800,
            color: currentDebt > 0 ? 'error.main' : 'success.main',
            mt: 0.5
          }}
        >
          {format.euro(currentDebt)}
        </Typography>
      </Box>

      {/* Credit Limit Progress Bar */}
      {hasLimit
        ? (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant='caption' color='text.secondary'>
                Disponible: {format.euro(availableCredit ?? 0)} de {format.euro(limit)}
              </Typography>
              <Typography variant='caption' sx={{ fontWeight: 700 }}>
                {usagePercent}% usado
              </Typography>
            </Stack>
            <LinearProgress
              variant='determinate'
              value={usagePercent}
              color={usagePercent > 85 ? 'error' : usagePercent > 60 ? 'warning' : 'primary'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
          )
        : (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Chip
              label='Sin límite configurado'
              size='small'
              variant='outlined'
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
          )}

      {/* Action Buttons */}
      <Stack direction='row' spacing={1.5} sx={{ mt: 3 }}>
        <Button
          variant='outlined'
          size='small'
          startIcon={<PlusOutlined />}
          onClick={() => onAddMovement(card)}
          fullWidth
        >
          Movimiento
        </Button>

        <Button
          variant='contained'
          size='small'
          color='success'
          startIcon={<DollarOutlined />}
          onClick={() => onPayDebt(card)}
          disabled={currentDebt <= 0}
          fullWidth
          sx={{ fontWeight: 700 }}
        >
          Pagar Deuda
        </Button>
      </Stack>

      {/* Overflow Menu */}
      <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose()
            onEdit(card)
          }}
        >
          <EditOutlined style={{ marginRight: 8 }} /> Editar tarjeta
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose()
            onDelete(card)
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlined style={{ marginRight: 8 }} /> Eliminar tarjeta
        </MenuItem>
      </Menu>
    </MainCard>
  )
}
