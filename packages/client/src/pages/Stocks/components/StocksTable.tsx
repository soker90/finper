import { useState } from 'react'
import { TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { ScrollableTable } from 'components'
import { StockPosition } from 'types'
import RemoveModal from './RemoveModal'
import PositionRow from './PositionRow'

interface Props {
  positions: StockPosition[]
  onDeletePurchase: (id: string) => void
}

const StocksTable = ({ positions, onDeletePurchase }: Props) => {
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)

  return (
    <>
      <ScrollableTable title='Posiciones' cardSx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Ticker / Empresa</TableCell>
            <TableCell align='right'>Acciones</TableCell>
            <TableCell align='right'>Coste medio</TableCell>
            <TableCell align='right'>Coste total</TableCell>
            <TableCell align='right'>Precio actual</TableCell>
            <TableCell align='right'>Ganancia / Pérdida</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {positions.length === 0
            ? (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  <Typography
                    color='textSecondary' sx={{
                      py: 2
                    }}
                  >No hay posiciones registradas
                  </Typography>
                </TableCell>
              </TableRow>
              )
            : positions.map(pos => (
              <PositionRow key={pos.ticker} position={pos} onDeletePurchase={setPurchaseToDelete} />
            ))}
        </TableBody>
      </ScrollableTable>
      {purchaseToDelete && (
        <RemoveModal
          title='Eliminar operación'
          description='¿Estás seguro de que quieres eliminar esta operación de acciones?'
          onClose={() => setPurchaseToDelete(null)}
          onConfirm={() => {
            onDeletePurchase(purchaseToDelete)
            setPurchaseToDelete(null)
          }}
        />
      )}
    </>
  )
}

export default StocksTable
