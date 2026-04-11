import { useState } from 'react'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Modal,
  Tooltip
} from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { Supply, SupplyReading, SupplyReadingInput } from 'types'
import { useSupplyReadings } from 'hooks'
import { supplyDisplayName, SUPPLY_TYPE_UNITS } from '../../utils/supply'
import RemoveModal from '../RemoveModal'
import SupplyReadingForm from '../SupplyReadingForm'
import SupplyReadingList from '../SupplyReadingList'

interface Props {
  supply: Supply
  onClose: () => void
}

const SupplyReadingModal = ({ supply, onClose }: Props) => {
  const { readings, isLoading, createReading, updateReading, removeReading } = useSupplyReadings(supply._id)

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<SupplyReading | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SupplyReading | null>(null)

  const handleFormSubmit = (data: Omit<SupplyReadingInput, 'supplyId'>) => {
    const payload: SupplyReadingInput = { ...data, supplyId: supply._id }
    return editTarget
      ? updateReading(editTarget._id, payload)
      : createReading(payload)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditTarget(null)
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Card sx={{ minWidth: 600, maxWidth: 900, maxHeight: '90vh', overflow: 'auto' }}>
          <CardHeader
            title={`Lecturas — ${supplyDisplayName(supply)}`}
            action={
              <Tooltip title='Añadir lectura'>
                <IconButton
                  color='primary'
                  aria-label='añadir lectura'
                  onClick={() => setShowForm(true)}
                >
                  <PlusOutlined />
                </IconButton>
              </Tooltip>
            }
          />
          <Divider />
          <CardContent>
            <SupplyReadingList
              readings={readings}
              isLoading={isLoading}
              isElectricity={supply.type === 'electricity'}
              unit={SUPPLY_TYPE_UNITS[supply.type]}
              onAdd={() => setShowForm(true)}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          </CardContent>
          <Divider />
          <CardActions>
            <Button onClick={onClose}>Cerrar</Button>
          </CardActions>
        </Card>
      </Modal>

      {(showForm || Boolean(editTarget)) && (
        <SupplyReadingForm
          supply={supply}
          reading={editTarget ?? undefined}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
        />
      )}

      {deleteTarget && (
        <RemoveModal
          title='¿Eliminar lectura?'
          description={`¿Eliminar la lectura del ${dayjs(deleteTarget.startDate).format('DD/MM/YYYY')} al ${dayjs(deleteTarget.endDate).format('DD/MM/YYYY')}?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => removeReading(deleteTarget._id)}
        />
      )}
    </>
  )
}

export default SupplyReadingModal
