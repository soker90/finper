import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined } from '@ant-design/icons'

import { BankIcon } from 'components/icons'
import { useAccounts } from 'hooks'
import { AmortizationRow } from 'types'

import { LoanStatsPanel, LoanAmortizationTable, LoanSimulator, LoanFormModal, LoanPayModal, LoanAmortizeModal, LoanEventModal, LoanRemoveModal, LoanEditPaymentModal, LoanDeletePaymentModal } from '../components'
import { useLoan } from '../hooks'

type ModalState =
  | { type: 'edit' }
  | { type: 'amortize' }
  | { type: 'event' }
  | { type: 'remove' }
  | { type: 'editPayment'; data: AmortizationRow }
  | { type: 'deletePayment'; data: AmortizationRow }
  | { type: 'pay'; data: AmortizationRow }

const LoanDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loan, isLoading } = useLoan(id ?? '')
  const { accounts } = useAccounts()
  const linkedAccount = accounts.find(account => account._id === loan?.account)

  const [activeModal, setActiveModal] = useState<ModalState | null>(null)
  const closeModal = () => setActiveModal(null)
  const handleRemoveClose = () => {
    closeModal()
    navigate('/prestamos')
  }

  if (!id) {
    navigate('/prestamos', { replace: true })
    return null
  }

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' mt={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (!loan) {
    return (
      <Typography color='textSecondary' mt={4} textAlign='center'>
        Préstamo no encontrado.
      </Typography>
    )
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box display='flex' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={1}>
        <Box display='flex' alignItems='center' gap={1}>
          <Button
            startIcon={<ArrowLeftOutlined />}
            onClick={() => navigate('/prestamos')}
            size='small'
          >
            Volver
          </Button>
          <Typography variant='h4'>{loan.name}</Typography>
          <BankIcon name={linkedAccount?.bank ?? ''} width={24} height={24} />
        </Box>
        <Stack direction='row' spacing={1} flexWrap='wrap'>
          <Button variant='outlined' onClick={() => setActiveModal({ type: 'amortize' })}>
            Amortización extra
          </Button>
          <Button variant='outlined' onClick={() => setActiveModal({ type: 'event' })}>
            Cambio tipo/cuota
          </Button>
          <Button variant='outlined' onClick={() => setActiveModal({ type: 'edit' })}>
            Editar
          </Button>
          <Button variant='outlined' color='error' onClick={() => setActiveModal({ type: 'remove' })}>
            Eliminar
          </Button>
        </Stack>
      </Box>

      {/* Stats */}
      <LoanStatsPanel stats={loan.stats} />

      {/* Simulator */}
      <LoanSimulator
        loanId={id}
        monthlyPayment={loan.stats.currentPayment}
        pendingAmount={loan.pendingAmount}
      />

      {/* Amortization table */}
      <LoanAmortizationTable
        rows={loan.amortizationTable}
        onDeletePayment={(row) => setActiveModal({ type: 'deletePayment', data: row })}
        onEditPayment={(row) => setActiveModal({ type: 'editPayment', data: row })}
        onPayPayment={(row) => setActiveModal({ type: 'pay', data: row })}
      />

      {/* Modals */}
      {activeModal?.type === 'deletePayment' && (
        <LoanDeletePaymentModal
          loanId={id}
          payment={activeModal.data}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === 'editPayment' && (
        <LoanEditPaymentModal
          loanId={id}
          payment={activeModal.data}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === 'edit' && (
        <LoanFormModal
          loan={loan}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === 'pay' && (
        <LoanPayModal
          loan={loan}
          row={activeModal.data}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === 'amortize' && (
        <LoanAmortizeModal
          loan={loan}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === 'event' && (
        <LoanEventModal
          loan={loan}
          onClose={closeModal}
        />
      )}
      {activeModal?.type === 'remove' && (
        <LoanRemoveModal
          loan={loan}
          onClose={handleRemoveClose}
        />
      )}
    </Stack>
  )
}

export default LoanDetail
