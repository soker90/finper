import { useState } from 'react'
import {
  TableRow, TableCell, IconButton, Typography, Tooltip, Box,
  Chip, Collapse, Table, TableHead, TableBody
} from '@mui/material'
import { DownOutlined, RightOutlined, GiftOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { StockPosition } from 'types'
import PurchasesRow from './PurchasesRow'

interface Props {
  position: StockPosition
  onDeletePurchase: (id: string) => void
}

const PositionRow = ({ position, onDeletePurchase }: Props) => {
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
        <TableCell align='right'>
          {position.dividendShares > 0
            ? (
              <Tooltip title={`${format.number(position.dividendShares, { maximumFractionDigits: 4 })} ganadas por dividendos`}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                  {format.number(position.shares, { maximumFractionDigits: 4 })}
                  <GiftOutlined style={{ fontSize: 12, opacity: 0.7 }} />
                </Box>
              </Tooltip>
              )
            : (
                format.number(position.shares, { maximumFractionDigits: 4 })
              )}
        </TableCell>
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

export default PositionRow
