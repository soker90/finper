import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined } from '@ant-design/icons'

import { BankIcon } from 'components/icons'
import { useAccounts } from 'hooks'
import { AmortizationRow, Loan } from 'types'

import { LoanStatsPanel, LoanAmortizationTable, LoanFormModal, LoanPayModal, LoanAmortizeModal, LoanEventModal, LoanRemoveModal, LoanEditPaymentModal, LoanDeletePaymentModal } from '../components'
import { useLoan } from '../hooks'

const LoanDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { loan, isLoading } = useLoan(id!)
  const { accounts } = useAccounts()
  const linkedAccount = accounts.find(a => a._id === loan?.account)

  const [showEdit, setShowEdit] = useState(false)
  const [showAmortize, setShowAmortize] = useState(false)
  const [showEvent, setShowEvent] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [editingPayment, setEditingPayment] = useState<AmortizationRow | null>(null)
  const [deletingPayment, setDeletingPayment] = useState<AmortizationRow | null>(null)
  const [payingRow, setPayingRow] = useState<AmortizationRow | null>(null)

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
          <Button variant='outlined' onClick={() => setShowAmortize(true)}>
            Amortización extra
          </Button>
          <Button variant='outlined' onClick={() => setShowEvent(true)}>
            Cambio tipo/cuota
          </Button>
          <Button variant='outlined' onClick={() => setShowEdit(true)}>
            Editar
          </Button>
          <Button variant='outlined' color='error' onClick={() => setShowRemove(true)}>
            Eliminar
          </Button>
        </Stack>
      </Box>

      {/* Stats */}
      <LoanStatsPanel stats={loan.stats} />

      {/* Amortization table */}
      <LoanAmortizationTable
        rows={loan.amortizationTable}
        onDeletePayment={(row) => setDeletingPayment(row)}
        onEditPayment={(row) => setEditingPayment(row)}
        onPayPayment={(row) => setPayingRow(row)}
      />

      {/* Modals */}
      {deletingPayment && (
        <LoanDeletePaymentModal
          loanId={id!}
          payment={deletingPayment}
          onClose={() => setDeletingPayment(null)}
        />
      )}
      {editingPayment && (
        <LoanEditPaymentModal
          loanId={id!}
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
        />
      )}
      {showEdit && (
        <LoanFormModal
          loan={loan as Loan}
          onClose={() => setShowEdit(false)}
        />
      )}
      {payingRow && (
        <LoanPayModal
          loan={loan as Loan}
          row={payingRow}
          onClose={() => setPayingRow(null)}
        />
      )}
      {showAmortize && (
        <LoanAmortizeModal
          loan={loan as Loan}
          onClose={() => setShowAmortize(false)}
        />
      )}
      {showEvent && (
        <LoanEventModal
          loan={loan as Loan}
          onClose={() => setShowEvent(false)}
        />
      )}
      {showRemove && (
        <LoanRemoveModal
          loan={loan as Loan}
          onClose={() => {
            setShowRemove(false)
            navigate('/prestamos')
          }}
        />
      )}
    </Stack>
  )
}

export default LoanDetail
