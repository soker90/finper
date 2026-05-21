import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Stack } from '@mui/material'

import { MainCard } from 'components'
import { Supply, SupplyInput } from 'types'
import { useSupplyReadings } from 'hooks'
import { hoverCardSx } from '../../../Dashboard/components/shared'
import { supplyDisplayName, SUPPLY_TYPE_UNITS } from '../../utils/supply'
import SupplyForm from '../SupplyForm'
import RemoveModal from '../RemoveModal'
import SupplyCardHeader from './SupplyCardHeader'
import SupplyReadingPreview from './SupplyReadingPreview'

type Props = {
  supply: Supply
  propertyId: string
  onEdit: (id: string, data: SupplyInput) => Promise<{ error?: string }>
  onDelete: (id: string) => Promise<{ error?: string }>
}

const SupplyCard = ({ supply, propertyId, onEdit, onDelete }: Props) => {
  const navigate = useNavigate()
  const { readings } = useSupplyReadings(supply._id)
  const lastReadings = readings.slice(0, 3)

  const [showForm, setShowForm] = useState(false)
  const [showRemove, setShowRemove] = useState(false)

  return (
    <>
      <MainCard
        contentSX={{ p: 2 }}
        sx={{ ...hoverCardSx, cursor: 'pointer' }}
        onClick={() => navigate(`/suministros/${supply._id}`)}
      >
        <Stack spacing={1}>
          <SupplyCardHeader
            supply={supply}
            onEdit={(e) => { e.stopPropagation(); setShowForm(true) }}
            onDelete={(e) => { e.stopPropagation(); setShowRemove(true) }}
          />
          <SupplyReadingPreview
            readings={lastReadings}
            isElectricity={supply.type === 'electricity'}
            unit={SUPPLY_TYPE_UNITS[supply.type]}
          />
        </Stack>
      </MainCard>

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
