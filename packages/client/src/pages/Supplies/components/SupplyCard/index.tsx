import { useState } from 'react'
import { Box, Card, CardContent, Chip, IconButton, Typography, Tooltip } from '@mui/material'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Supply, SupplyInput, SupplyType } from 'types'
import SupplyForm from '../SupplyForm'
import RemoveModal from '../RemoveModal'

export const SUPPLY_TYPE_LABELS: Record<SupplyType, string> = {
  electricity: 'Electricidad',
  water: 'Agua',
  gas: 'Gas',
  internet: 'Internet',
  other: 'Otro'
}

const SUPPLY_TYPE_COLORS: Record<SupplyType, 'warning' | 'info' | 'error' | 'default' | 'primary'> = {
  electricity: 'warning',
  water: 'info',
  gas: 'error',
  internet: 'primary',
  other: 'default'
}

export const supplyDisplayName = (supply: Supply) =>
  supply.type === 'other' ? supply.name ?? '' : SUPPLY_TYPE_LABELS[supply.type]

type Props = {
  supply: Supply
  propertyId: string
  onEdit: (id: string, data: SupplyInput) => Promise<{ error?: string }>
  onDelete: (id: string) => Promise<{ error?: string }>
}

const SupplyCard = ({ supply, propertyId, onEdit, onDelete }: Props) => {
  const [showForm, setShowForm] = useState(false)
  const [showRemove, setShowRemove] = useState(false)

  return (
    <>
      <Card variant='elevation' elevation={2} sx={{ height: '100%' }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant='subtitle1' fontWeight={500}>
                {supplyDisplayName(supply)}
              </Typography>
              {supply.type === 'other' && (
                <Chip
                  label={SUPPLY_TYPE_LABELS[supply.type]}
                  color={SUPPLY_TYPE_COLORS[supply.type]}
                  size='small'
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title='Editar'>
                <IconButton size='small' onClick={() => setShowForm(true)}>
                  <EditOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title='Eliminar'>
                <IconButton size='small' color='error' onClick={() => setShowRemove(true)}>
                  <DeleteOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {showForm && (
        <SupplyForm
          supply={supply}
          propertyId={propertyId}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => onEdit(supply._id, data)}
        />
      )}

      {showRemove && (
        <RemoveModal
          title='¿Eliminar suministro?'
          description={`¿Seguro que quieres eliminar el suministro "${supplyDisplayName(supply)}"?`}
          onClose={() => setShowRemove(false)}
          onConfirm={() => onDelete(supply._id)}
        />
      )}
    </>
  )
}

export default SupplyCard
