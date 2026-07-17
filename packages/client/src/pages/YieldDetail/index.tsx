import React, { useState, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router'
import useSWR, { mutate } from 'swr'
import {
  Stack, Box, Typography, Chip, IconButton, Button,
  Avatar, CircularProgress, ToggleButtonGroup, ToggleButton, Alert
} from '@mui/material'
import {
  ArrowLeftOutlined, EditOutlined, SearchOutlined, BankOutlined,
  ShoppingOutlined, DeleteOutlined
} from '@ant-design/icons'

import MainCard from 'components/MainCard'
import { YIELDS, YIELD_MATCHING_TRANSACTIONS } from 'constants/api-paths'
import { useAccounts } from 'hooks/useAccounts'
import { useYield, useYields, useUnlinkYieldTransaction } from 'hooks/useYields'
import { editYieldSettlement } from 'services/apiService'

// Subcomponents
import YieldDetailKpi from './components/YieldDetailKpi'
import YieldSettlementsTable from './components/YieldSettlementsTable'
import EditSettlementModal from './components/EditSettlementModal'
import DeleteSettlementModal from './components/DeleteSettlementModal'
import YieldForm from '../Yields/components/YieldForm'
import LinkTransactionsModal from '../Yields/components/LinkTransactionsModal'
import YieldRemoveModal from '../Yields/components/YieldRemoveModal'
import { YieldSettlement, YieldEntry } from 'types'

// Lazy loaded chart to comply with React Doctor recommendations
const YieldSettlementChart = React.lazy(() => import('./components/YieldSettlementChart'))

const TYPE_LABEL: Record<string, string> = {
  interest: 'Remunerada',
  cashback: 'Cashback'
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  interest: <BankOutlined />,
  cashback: <ShoppingOutlined />
}

const YieldDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { yieldData, isLoading: loadingDetail, mutate: mutateDetail } = useYield(id)
  const { accounts } = useAccounts()
  const { updateYield } = useYields()
  const unlinkTransaction = useUnlinkYieldTransaction()
  // Suggests linking recent unlinked movements instead of relying on the user to remember.
  const { data: matchingTransactions } = useSWR<YieldEntry[]>(id ? YIELD_MATCHING_TRANSACTIONS(id) : null)

  const [showForm, setShowForm] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [fixedSettlement, setFixedSettlement] = useState<YieldSettlement | null>(null)
  const [editingSettlement, setEditingSettlement] = useState<YieldSettlement | null>(null)
  const [deletingSettlement, setDeletingSettlement] = useState<YieldSettlement | null>(null)
  const [viewMode, setViewMode] = useState<'settlement' | 'annual'>('settlement')

  if (loadingDetail) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!yieldData) {
    return (
      <Typography color='textSecondary' sx={{ mt: 4, textAlign: 'center' }}>
        Rendimiento no encontrado.
      </Typography>
    )
  }

  const account = accounts.find((accountItem) => accountItem._id === yieldData.accountId)
  const currentBalance = account ? account.balance : 0

  const handleUnlink = (transactionId: string) => unlinkTransaction(yieldData._id, transactionId)

  const handleEditSettlementSubmit = async (tae: number | null, averageBalance: number | null) => {
    if (!editingSettlement) return
    const result = await editYieldSettlement({ id: yieldData._id, settlementId: editingSettlement.id, payload: { tae, averageBalance } })
    if (result.error) {
      return result
    }
    await mutateDetail()
    mutate(YIELDS)
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack
        direction='row'
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mt: -5
        }}
      >
        <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/rendimientos')} color='inherit' aria-label='Volver'>
            <ArrowLeftOutlined />
          </IconButton>
          <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 44, height: 44 }}>
            {TYPE_ICON[yieldData.type]}
          </Avatar>
          <Box>
            <Typography variant='h3'>{yieldData.account.name} - {TYPE_LABEL[yieldData.type] ?? yieldData.type}</Typography>
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
              <Typography variant='caption' color='textSecondary'>
                Cuenta: {yieldData.account.name} ({yieldData.account.bank})
              </Typography>
              <Chip
                label={TYPE_LABEL[yieldData.type] ?? yieldData.type}
                size='small'
                sx={{ height: 18, fontSize: 10 }}
              />
            </Stack>
          </Box>
        </Stack>

        <Stack direction='row' spacing={1}>
          <Button
            variant='outlined'
            startIcon={<SearchOutlined />}
            onClick={() => {
              setFixedSettlement(null)
              setShowLinkModal(true)
            }}
          >
            Enlazar movimientos
          </Button>
          <Button
            variant='contained'
            startIcon={<EditOutlined />}
            onClick={() => setShowForm(true)}
          >
            Editar
          </Button>
          <Button
            variant='outlined'
            color='error'
            startIcon={<DeleteOutlined />}
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar
          </Button>
        </Stack>
      </Stack>

      {matchingTransactions && matchingTransactions.length > 0 && (
        <Alert
          severity='info'
          action={
            <Button
              color='inherit'
              size='small'
              onClick={() => {
                setFixedSettlement(null)
                setShowLinkModal(true)
              }}
            >
              Enlazar ahora
            </Button>
          }
        >
          Tienes {matchingTransactions.length} movimiento{matchingTransactions.length === 1 ? '' : 's'} sin enlazar en esta cuenta.
        </Alert>
      )}

      {/* KPI Stats */}
      <YieldDetailKpi yieldData={yieldData} currentBalance={currentBalance} viewMode={viewMode} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1 }}>
        <ToggleButtonGroup
          size='small'
          value={viewMode}
          exclusive
          onChange={(_, val) => {
            if (val !== null) setViewMode(val)
          }}
          color='primary'
        >
          <ToggleButton value='settlement' sx={{ px: 2, textTransform: 'none', fontWeight: 600 }}>
            Por liquidación
          </ToggleButton>
          <ToggleButton value='annual' sx={{ px: 2, textTransform: 'none', fontWeight: 600 }}>
            Vista Anual
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Recharts lazy loaded under Suspense */}
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      }
      >
        <YieldSettlementChart yieldData={yieldData} viewMode={viewMode} />
      </Suspense>

      {/* Settlements Table */}
      <MainCard title={viewMode === 'annual' ? 'Resumen Anual de Liquidaciones' : 'Detalle de Liquidaciones'} content={false} sx={{ overflowX: 'auto' }}>
        <YieldSettlementsTable
          yieldData={yieldData}
          viewMode={viewMode}
          onEditSettlement={(settlement) => setEditingSettlement(settlement)}
          onLinkToSettlement={(settlement) => {
            setFixedSettlement(settlement)
            setShowLinkModal(true)
          }}
          onUnlinkTransaction={handleUnlink}
          onDeleteSettlement={(settlement) => setDeletingSettlement(settlement)}
        />
      </MainCard>

      {/* Modals */}
      {showForm && (
        <YieldForm
          editingYield={yieldData}
          onClose={() => setShowForm(false)}
          onSubmit={async (data) => {
            const result = await updateYield(yieldData._id, data)
            if (!result.error) {
              await mutateDetail()
              mutate(YIELDS)
            }
            return result
          }}
        />
      )}

      {showLinkModal && (
        <LinkTransactionsModal
          item={yieldData}
          fixedSettlement={fixedSettlement ?? undefined}
          onClose={() => {
            setShowLinkModal(false)
            setFixedSettlement(null)
          }}
          onLinked={async () => {
            setShowLinkModal(false)
            setFixedSettlement(null)
            await mutateDetail()
            mutate(YIELDS)
            mutate(YIELD_MATCHING_TRANSACTIONS(yieldData._id))
          }}
        />
      )}

      {editingSettlement && (
        <EditSettlementModal
          settlement={editingSettlement}
          onClose={() => setEditingSettlement(null)}
          onSubmit={handleEditSettlementSubmit}
        />
      )}

      {showDeleteModal && (
        <YieldRemoveModal
          item={yieldData}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => navigate('/rendimientos')}
        />
      )}

      {deletingSettlement && (
        <DeleteSettlementModal
          yieldId={yieldData._id}
          settlement={deletingSettlement}
          onClose={() => setDeletingSettlement(null)}
        />
      )}
    </Stack>
  )
}

export default YieldDetail
