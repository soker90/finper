import React, { useState } from 'react'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'

interface Props {
  settlement: any
  onClose: () => void
  onSubmit: (tae: number | null, averageBalance: number | null) => Promise<{ error?: string } | void>
}

const EditSettlementModal = ({ settlement, onClose, onSubmit }: Props) => {
  const [tae, setTae] = useState<string>(
    settlement.tae !== null && settlement.tae !== undefined ? String(settlement.tae) : ''
  )
  const [averageBalance, setAverageBalance] = useState<string>(
    settlement.averageBalance !== null && settlement.averageBalance !== undefined ? String(settlement.averageBalance) : ''
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const result = await onSubmit(
      tae ? parseFloat(tae) : null,
      averageBalance ? parseFloat(averageBalance) : null
    )
    setSubmitting(false)
    if (result && result.error) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <ModalGrid
      show
      title='Editar Liquidación'
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={submitting}
    >
      <InputForm
        id='tae'
        label='TAE (%)'
        type='number'
        value={tae}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTae(e.target.value)}
        inputProps={{ step: 'any' }}
        size={6}
        error={false}
        errorText=''
      />
      <InputForm
        id='averageBalance'
        label='Saldo Medio (€)'
        type='number'
        value={averageBalance}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAverageBalance(e.target.value)}
        inputProps={{ step: 'any' }}
        size={6}
        error={false}
        errorText=''
      />
      {error && (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='error'>{error}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default EditSettlementModal
