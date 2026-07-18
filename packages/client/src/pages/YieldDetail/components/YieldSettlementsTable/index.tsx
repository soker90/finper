import { YieldDetail, YieldSettlement } from 'types'
import AnnualTable from './AnnualTable'
import SettlementTable from './SettlementTable'

interface Props {
  yieldData: YieldDetail
  viewMode?: 'settlement' | 'annual'
  onEditSettlement: (settlement: YieldSettlement) => void
  onLinkToSettlement: (settlement: YieldSettlement) => void
  onUnlinkTransaction: (transactionId: string) => void
  onDeleteSettlement: (settlement: YieldSettlement) => void
}

const YieldSettlementsTable = ({ yieldData, viewMode = 'settlement', onEditSettlement, onLinkToSettlement, onUnlinkTransaction, onDeleteSettlement }: Props) => {
  if (viewMode === 'annual') {
    return <AnnualTable yieldData={yieldData} />
  }

  return (
    <SettlementTable
      yieldData={yieldData}
      onEditSettlement={onEditSettlement}
      onLinkToSettlement={onLinkToSettlement}
      onUnlinkTransaction={onUnlinkTransaction}
      onDeleteSettlement={onDeleteSettlement}
    />
  )
}

export default YieldSettlementsTable
