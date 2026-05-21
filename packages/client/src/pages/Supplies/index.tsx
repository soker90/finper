import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { HeaderButtons } from 'components'
import { useSupplies } from 'hooks'
import { PropertyWithSupplies, PropertyInput, SupplyInput } from 'types'
import { PropertyCard, PropertyForm } from './components'

const Supplies = () => {
  const {
    properties,
    isLoading,
    createProperty,
    updateProperty,
    removeProperty,
    createSupply,
    updateSupply,
    removeSupply
  } = useSupplies()

  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editProperty, setEditProperty] = useState<PropertyWithSupplies | undefined>()

  const handleClosePropertyForm = () => {
    setShowPropertyForm(false)
    setEditProperty(undefined)
  }

  const handlePropertySubmit = (data: PropertyInput) =>
    editProperty
      ? updateProperty(editProperty._id, data)
      : createProperty(data)

  return (
    <>
      <HeaderButtons
        buttons={[{ Icon: PlusOutlined, title: 'Nuevo inmueble', onClick: () => setShowPropertyForm(true) }]}
        desktopSx={{ marginTop: -7, marginBottom: 2 }}
      />
      {isLoading && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{
            color: 'text.secondary'
          }}
          >Cargando suministros…
          </Typography>
        </Box>
      )}
      {!isLoading && properties.length === 0 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography
            variant='h6' gutterBottom sx={{
              color: 'text.secondary'
            }}
          >
            Aún no tienes inmuebles
          </Typography>
          <Typography
            variant='body2' sx={{
              color: 'text.secondary'
            }}
          >
            Pulsa «Nuevo inmueble» para empezar a registrar tus suministros.
          </Typography>
        </Box>
      )}
      {!isLoading && properties.map((property) => (
        <PropertyCard
          key={property._id}
          property={property}
          onEditProperty={setEditProperty}
          onDeleteProperty={removeProperty}
          onCreateSupply={(data: SupplyInput) => createSupply({ ...data, propertyId: property._id })}
          onEditSupply={updateSupply}
          onDeleteSupply={removeSupply}
        />
      ))}
      {(showPropertyForm || Boolean(editProperty)) && (
        <PropertyForm
          property={editProperty}
          onClose={handleClosePropertyForm}
          onSubmit={handlePropertySubmit}
        />
      )}
    </>
  )
}

export default Supplies
