import { useMemo, useState } from 'react'
import { Grid } from '@mui/material'
import { PlusOutlined, GiftOutlined } from '@ant-design/icons'
import { StockOperationType } from 'types'

import { HeaderButtons, LoadingList } from 'components'
import { useStocks } from './hooks'
import { StockStatCard, StocksTable, AddStockModal } from './components'

const Stocks = () => {
  const { positions, addStock, deleteStock, isLoading } = useStocks()
  const [showModal, setShowModal] = useState<StockOperationType | false>(false)

  const summary = useMemo(() => {
    const totalCost = positions.reduce((acc, p) => acc + p.totalCost, 0)

    const positionsWithPrice = positions.filter(p => p.currentValue !== null)
    const totalValue = positionsWithPrice.length > 0
      ? positionsWithPrice.reduce((acc, p) => acc + (p.currentValue ?? 0), 0)
      : null

    const totalGainLoss = totalValue !== null ? totalValue - positionsWithPrice.reduce((acc, p) => acc + p.totalCost, 0) : null
    const coveredCost = positionsWithPrice.reduce((acc, p) => acc + p.totalCost, 0)
    const totalGainLossPct = totalGainLoss !== null && coveredCost > 0
      ? Math.round((totalGainLoss / coveredCost) * 10000) / 100
      : null

    return { totalCost, totalValue, totalGainLoss, totalGainLossPct }
  }, [positions])

  if (isLoading) {
    return <LoadingList />
  }

  return (
    <>
      <HeaderButtons
        buttons={[
          {
            Icon: PlusOutlined,
            title: 'Nueva compra',
            onClick: () => setShowModal('buy')
          },
          {
            Icon: GiftOutlined,
            title: 'Añadir dividendo',
            onClick: () => setShowModal('dividend')
          }
        ]}
        desktopSx={{ marginTop: -7 }}
      />

      <Grid container spacing={3} my={3}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StockStatCard title='Coste total' value={summary.totalCost} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StockStatCard title='Valor actual' value={summary.totalValue} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StockStatCard title='Ganancia / Pérdida' value={summary.totalGainLoss} colorize />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <StockStatCard title='Rentabilidad (%)' value={summary.totalGainLossPct} currency={false} colorize />
        </Grid>
      </Grid>

      <StocksTable positions={positions} onDeletePurchase={deleteStock} />

      {showModal && (
        <AddStockModal
          defaultType={showModal}
          onClose={() => setShowModal(false)}
          onAdd={addStock}
        />
      )}
    </>
  )
}

export default Stocks
