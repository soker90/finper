import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  Typography,
  Divider,
  Tooltip
} from '@mui/material'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { PropertyWithSupplies, Supply, SupplyInput, SupplyType } from 'types'
import SupplyForm from '../SupplyForm'
import RemoveModal from '../RemoveModal'

const SUPPLY_TYPE_LABELS: Record<SupplyType, string> = {
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

const supplyDisplayName = (supply: Supply) =>
  supply.type === 'other' ? supply.name ?? '' : SUPPLY_TYPE_LABELS[supply.type]

type Props = {
  property: PropertyWithSupplies
  onEditProperty: (property: PropertyWithSupplies) => void
  onDeleteProperty: (id: string) => Promise<{ error?: string }>
  onCreateSupply: (data: SupplyInput) => Promise<{ error?: string }>
  onEditSupply: (id: string, data: SupplyInput) => Promise<{ error?: string }>
  onDeleteSupply: (id: string) => Promise<{ error?: string }>
}

const PropertyCard = ({
  property,
  onEditProperty,
  onDeleteProperty,
  onCreateSupply,
  onEditSupply,
  onDeleteSupply
}: Props) => {
  const [showSupplyForm, setShowSupplyForm] = useState(false)
  const [editSupply, setEditSupply] = useState<Supply | undefined>()
  const [removeSupply, setRemoveSupply] = useState<Supply | undefined>()
  const [showRemoveProperty, setShowRemoveProperty] = useState(false)

  const handleSupplySubmit = async (data: SupplyInput) => {
    if (editSupply) {
      return onEditSupply(editSupply._id, data)
    }
    return onCreateSupply(data)
  }

  const handleCloseSupplyForm = () => {
    setShowSupplyForm(false)
    setEditSupply(undefined)
  }

  const renderEmpty = () => (
    <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 2 }}>
      Sin suministros. Pulsa&nbsp;
      <Typography
        component='span'
        variant='body2'
        color='primary'
        sx={{ cursor: 'pointer' }}
        onClick={() => setShowSupplyForm(true)}
      >
        + añadir suministro
      </Typography>
    </Typography>
  )

  const renderSupplies = () => (
    <Grid container spacing={2}>
      {property.supplies.map((supply) => (
        <Grid key={supply._id} size={{ xs: 12, sm: 6, md: 4 }}>
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
                    <IconButton
                      size='small'
                      onClick={() => {
                        setEditSupply(supply)
                        setShowSupplyForm(true)
                      }}
                    >
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Eliminar'>
                    <IconButton size='small' color='error' onClick={() => setRemoveSupply(supply)}>
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  return (
    <>
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Typography variant='h5' fontWeight={600}>
              {property.name}
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title='Añadir suministro'>
                <IconButton size='small' color='primary' onClick={() => setShowSupplyForm(true)}>
                  <PlusOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title='Editar inmueble'>
                <IconButton size='small' onClick={() => onEditProperty(property)}>
                  <EditOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title='Eliminar inmueble'>
                <IconButton size='small' color='error' onClick={() => setShowRemoveProperty(true)}>
                  <DeleteOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          {property.supplies.length === 0
            ? renderEmpty()
            : renderSupplies()}
        </CardContent>
      </Card>

      {(showSupplyForm || Boolean(editSupply)) && (
        <SupplyForm
          supply={editSupply}
          propertyId={property._id}
          onClose={handleCloseSupplyForm}
          onSubmit={handleSupplySubmit}
        />
      )}

      {Boolean(removeSupply) && (
        <RemoveModal
          title='¿Eliminar suministro?'
          description={`¿Seguro que quieres eliminar el suministro "${supplyDisplayName(removeSupply!)}"?`}
          onClose={() => setRemoveSupply(undefined)}
          onConfirm={() => onDeleteSupply(removeSupply!._id)}
        />
      )}

      {showRemoveProperty && (
        <RemoveModal
          title='¿Eliminar inmueble?'
          description={`¿Seguro que quieres eliminar el inmueble "${property.name}" y todos sus suministros?`}
          onClose={() => setShowRemoveProperty(false)}
          onConfirm={() => onDeleteProperty(property._id)}
        />
      )}
    </>
  )
}

export default PropertyCard
