import { useState } from 'react'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import { useSubmitError } from '../../Yields/hooks/useSubmitError'
import SettlementRateFields from '../../Yields/components/SettlementRateFields'
import { YieldSettlement } from 'types'

interface Props {
  settlement: YieldSettlement
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
  const { error, runSubmit } = useSubmitError()

  const handleFormSubmit = () => {
    setSubmitting(true)
    return runSubmit(
      () => onSubmit(tae ? parseFloat(tae) : null, averageBalance ? parseFloat(averageBalance) : null),
      onClose
    ).finally(() => setSubmitting(false))
  }

  return (
    <ModalGrid
      show
      title='Editar Liquidación'
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={submitting}
    >
      <SettlementRateFields
        tae={tae}
        onTaeChange={setTae}
        averageBalance={averageBalance}
        onAverageBalanceChange={setAverageBalance}
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
