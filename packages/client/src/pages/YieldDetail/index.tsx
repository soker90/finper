import React, { useState, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router'
import { mutate } from 'swr'
import {
  Stack, Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton
} from '@mui/material'

import MainCard from 'components/MainCard'
import { YIELDS } from 'constants/api-paths'
import { useAccounts } from 'hooks/useAccounts'
import { useYield, useYields, useUnlinkYieldTransaction } from 'hooks/useYields'
import { editYieldSettlement } from 'services/apiService'

// Subcomponents
import YieldDetailHeader from './components/YieldDetailHeader'
import YieldDetailKpi from './components/YieldDetailKpi'
import YieldSettlementsTable from './components/YieldSettlementsTable'
import EditSettlementModal from './components/EditSettlementModal'
import DeleteSettlementModal from './components/DeleteSettlementModal'
import YieldForm from '../Yields/components/YieldForm'
import LinkTransactionsModal from '../Yields/components/LinkTransactionsModal'
import YieldRemoveModal from '../Yields/components/YieldRemoveModal'
import { YieldSettlement } from 'types'

// Lazy loaded chart to comply with React Doctor recommendations
const YieldSettlementChart = React.lazy(() => import('./components/YieldSettlementChart'))

const YieldDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { yieldData, isLoading: loadingDetail, mutate: mutateDetail } = useYield(id)
  const { accounts } = useAccounts()
  const { updateYield } = useYields()
  const unlinkTransaction = useUnlinkYieldTransaction()

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
      <YieldDetailHeader
        yieldData={yieldData}
        onBack={() => navigate('/rendimientos')}
        onSearchTransactions={() => {
          setFixedSettlement(null)
          setShowLinkModal(true)
        }}
        onEdit={() => setShowForm(true)}
        onDelete={() => setShowDeleteModal(true)}
      />

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
