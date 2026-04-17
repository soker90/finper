import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton, Typography, Chip
} from '@mui/material'
import { DownOutlined, RightOutlined, DeleteOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
import { format } from 'utils'
import { StockPosition, StockPurchase } from 'types'

interface Props {
  positions: StockPosition[]
  onDeletePurchase: (id: string) => void
}

const PurchasesRow = ({ purchase, onDelete }: { purchase: StockPurchase, onDelete: (id: string) => void }) => (
  <TableRow sx={{ bgcolor: 'action.hover' }}>
    <TableCell />
    <TableCell>{format.date(purchase.date)}</TableCell>
    <TableCell align='right'>{format.number(purchase.shares, { maximumFractionDigits: 4 })}</TableCell>
    <TableCell align='right'>{format.euro(purchase.price)}</TableCell>
    <TableCell align='right'>{format.euro(purchase.shares * purchase.price)}</TableCell>
    <TableCell />
    <TableCell />
    <TableCell align='center'>
      <IconButton size='small' color='error' onClick={() => purchase._id && onDelete(purchase._id)}>
        <DeleteOutlined />
      </IconButton>
    </TableCell>
  </TableRow>
)

const PositionRow = ({ position, onDeletePurchase }: { position: StockPosition, onDeletePurchase: (id: string) => void }) => {
  const [open, setOpen] = useState(false)
  const gainColor = position.gainLoss === null ? undefined : position.gainLoss >= 0 ? 'success' : 'error'

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size='small' onClick={() => setOpen(o => !o)}>
            {open ? <DownOutlined /> : <RightOutlined />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography fontWeight={600}>{position.ticker}</Typography>
          <Typography variant='caption' color='textSecondary'>{position.name}</Typography>
        </TableCell>
        <TableCell align='right'>{format.number(position.shares, { maximumFractionDigits: 4 })}</TableCell>
        <TableCell align='right'>{format.euro(position.avgCost)}</TableCell>
        <TableCell align='right'>{format.euro(position.totalCost)}</TableCell>
        <TableCell align='right'>
          {position.currentPrice !== null ? format.euro(position.currentPrice) : '—'}
        </TableCell>
        <TableCell align='right'>
          {position.gainLoss !== null && gainColor
            ? (
              <Chip
                size='small'
                color={gainColor}
                label={`${format.euro(position.gainLoss)} (${position.gainLossPct}%)`}
              />
              )
            : '—'}
        </TableCell>
        <TableCell />
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} unmountOnExit>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Fecha</TableCell>
                  <TableCell align='right'>Acciones</TableCell>
                  <TableCell align='right'>Precio</TableCell>
                  <TableCell align='right'>Total</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {position.purchases.map(p => (
                  <PurchasesRow key={p._id} purchase={p} onDelete={onDeletePurchase} />
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

const StocksTable = ({ positions, onDeletePurchase }: Props) => (
  <MainCard sx={{ mt: 2 }} content={false}>
    <TableContainer>
      <Table>
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
                  <Typography color='textSecondary' py={2}>No hay posiciones registradas</Typography>
                </TableCell>
              </TableRow>
              )
            : positions.map(pos => (
              <PositionRow key={pos.ticker} position={pos} onDeletePurchase={onDeletePurchase} />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  </MainCard>
)

export default StocksTable
