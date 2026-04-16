import { useState } from 'react'
import {
  Box,
  Grid,
  IconButton,
  Typography,
  Tooltip
} from '@mui/material'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
import { PropertyWithSupplies, Supply, SupplyInput } from 'types'
import SupplyForm from '../SupplyForm'
import RemoveModal from '../RemoveModal'
import SupplyCard from '../SupplyCard'

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
  const [showRemoveProperty, setShowRemoveProperty] = useState(false)

  return (
    <>
      <MainCard
        title={property.name}
        secondary={
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title='Añadir suministro'>
              <IconButton size='small' color='primary' aria-label='Añadir suministro' onClick={() => setShowSupplyForm(true)}>
                <PlusOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title='Editar inmueble'>
              <IconButton size='small' aria-label='Editar inmueble' onClick={() => onEditProperty(property)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar inmueble'>
              <IconButton size='small' color='error' aria-label='Eliminar inmueble' onClick={() => setShowRemoveProperty(true)}>
                <DeleteOutlined />
              </IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ mt: 3 }}
      >
        {property.supplies.length === 0
          ? (
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
          : (
            <Grid container spacing={2}>
              {property.supplies.map((supply: Supply) => (
                <Grid key={supply._id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <SupplyCard
                    supply={supply}
                    propertyId={property._id}
                    onEdit={onEditSupply}
                    onDelete={onDeleteSupply}
                  />
                </Grid>
              ))}
            </Grid>
            )}
      </MainCard>

      {showSupplyForm && (
        <SupplyForm
          propertyId={property._id}
          onClose={() => setShowSupplyForm(false)}
          onSubmit={onCreateSupply}
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
