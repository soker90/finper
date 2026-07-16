import React, { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Collapse, Box, Typography, List, ListItem,
  ListItemText, Tooltip, IconButton, Stack, Chip
} from '@mui/material'
import {
  DownOutlined, UpOutlined, EditOutlined, DeleteOutlined, PlusOutlined
} from '@ant-design/icons'
import { format } from 'utils'
import { YieldDetail, YieldSettlement } from 'types'

interface Props {
  yieldData: YieldDetail
  onEditSettlement: (settlement: YieldSettlement) => void
  onLinkToSettlement: (settlement: YieldSettlement) => void
  onUnlinkTransaction: (transactionId: string) => void
}

const YieldSettlementsTable = ({ yieldData, onEditSettlement, onLinkToSettlement, onUnlinkTransaction }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ pl: 3 }} width={50} />
            <TableCell>Liquidación</TableCell>
            {yieldData.type === 'interest'
              ? (
                <>
                  <TableCell align='right'>Ingreso Bruto</TableCell>
                  <TableCell align='right'>Impuesto Retenido</TableCell>
                  <TableCell align='right'>Neto</TableCell>
                  <TableCell align='right'>TAE (%)</TableCell>
                  <TableCell align='right'>Saldo Medio</TableCell>
                </>
                )
              : (
                <>
                  <TableCell align='right'>Recibos (Gastos)</TableCell>
                  <TableCell align='right'>Cashback Devuelto</TableCell>
                  <TableCell align='right'>% Devuelto</TableCell>
                </>
                )}
            <TableCell align='center' width={120}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {yieldData.settlements.length === 0
            ? (
              <TableRow>
                <TableCell colSpan={yieldData.type === 'interest' ? 9 : 7} align='center' sx={{ py: 3 }}>
                  <Typography color='textSecondary'>
                    No hay liquidaciones creadas. Usa "Enlazar movimientos" para crear una.
                  </Typography>
                </TableCell>
              </TableRow>
              )
            : (
                yieldData.settlements.map((settlement) => {
                  const isOpen = Boolean(expanded[settlement.id])
                  const label = settlement.settlementDate
                    ? format.date(settlement.settlementDate)
                    : 'Pendiente'

                  return (
                    <React.Fragment key={settlement.id}>
                      <TableRow
                        hover
                        onClick={() => toggle(settlement.id)}
                        sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
                      >
                        <TableCell sx={{ pl: 3 }}>
                          <IconButton size='small'>
                            {isOpen ? <UpOutlined /> : <DownOutlined />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{label}</TableCell>
                        {yieldData.type === 'interest'
                          ? (
                            <>
                              <TableCell align='right'>{format.euro(settlement.grossIncome ?? 0)}</TableCell>
                              <TableCell align='right' sx={{ color: 'error.main' }}>
                                {settlement.taxExpense ? `-${format.euro(settlement.taxExpense)}` : '—'}
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 600, color: 'success.main' }}>
                                {format.euro(settlement.net ?? 0)}
                              </TableCell>
                              <TableCell align='right'>
                                {settlement.tae !== null && settlement.tae !== undefined
                                  ? (
                                    <Stack direction='row' spacing={0.5} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                                      <span>{format.number(settlement.tae)}%</span>
                                      <Tooltip title={settlement.taeSource === 'provided' ? 'Valor introducido' : 'Valor calculado automáticamente'}>
                                        <Chip
                                          label={settlement.taeSource === 'provided' ? 'introd.' : 'calc.'}
                                          size='small'
                                          variant='outlined'
                                          sx={{ height: 16, fontSize: 9 }}
                                        />
                                      </Tooltip>
                                    </Stack>
                                    )
                                  : '—'}
                              </TableCell>
                              <TableCell align='right'>
                                {settlement.averageBalance !== null && settlement.averageBalance !== undefined
                                  ? (
                                    <Stack direction='row' spacing={0.5} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                                      <span>{format.euro(settlement.averageBalance)}</span>
                                      <Tooltip title={settlement.balanceSource === 'provided' ? 'Valor introducido' : 'Valor calculado automáticamente'}>
                                        <Chip
                                          label={settlement.balanceSource === 'provided' ? 'introd.' : 'calc.'}
                                          size='small'
                                          variant='outlined'
                                          sx={{ height: 16, fontSize: 9 }}
                                        />
                                      </Tooltip>
                                    </Stack>
                                    )
                                  : '—'}
                              </TableCell>
                            </>
                            )
                          : (
                            <>
                              <TableCell align='right'>{format.euro(settlement.billsTotal ?? 0)}</TableCell>
                              <TableCell align='right' sx={{ fontWeight: 600, color: 'success.main' }}>
                                {format.euro(settlement.cashbackAmount ?? 0)}
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 600 }}>
                                {settlement.status === 'pending'
                                  ? (
                                    <Chip label='Pendiente de abono' color='warning' size='small' sx={{ height: 18, fontSize: 10 }} />
                                    )
                                  : (
                                      settlement.percentage !== null && settlement.percentage !== undefined
                                        ? `${format.number(settlement.percentage)}%`
                                        : '—'
                                    )}
                              </TableCell>
                            </>
                            )}
                        <TableCell align='center' onClick={(e) => e.stopPropagation()}>
                          <Tooltip title='Añadir movimiento a esta liquidación'>
                            <IconButton
                              size='small'
                              onClick={() => onLinkToSettlement(settlement)}
                              aria-label={`Añadir movimiento a ${label}`}
                            >
                              <PlusOutlined />
                            </IconButton>
                          </Tooltip>
                          {yieldData.type === 'interest' && (
                            <Tooltip title='Editar TAE / Saldo Medio'>
                              <IconButton
                                size='small'
                                onClick={() => onEditSettlement(settlement)}
                                aria-label={`Editar liquidación ${label}`}
                              >
                                <EditOutlined />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={yieldData.type === 'interest' ? 9 : 7}>
                          <Collapse in={isOpen} timeout='auto' unmountOnExit>
                            <Box sx={{ margin: 2, pl: 4 }}>
                              <Typography variant='h6' gutterBottom component='div'>
                                Movimientos de la liquidación
                              </Typography>
                              <List dense disablePadding>
                                {settlement.entries.map((entry) => (
                                  <ListItem
                                    key={entry._id}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      mb: 1,
                                      bgcolor: 'background.paper'
                                    }}
                                    secondaryAction={
                                      <Tooltip title='Desenlazar movimiento'>
                                        <IconButton
                                          edge='end'
                                          color='error'
                                          onClick={() => onUnlinkTransaction(entry._id)}
                                          aria-label='Desenlazar movimiento'
                                        >
                                          <DeleteOutlined />
                                        </IconButton>
                                      </Tooltip>
                                  }
                                  >
                                    <ListItemText
                                      primary={
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                          {format.date(entry.date)} · {entry.note || 'Sin nota'}
                                        </Typography>
                                  }
                                      secondary={
                                        <Typography variant='caption' color='textSecondary'>
                                          Categoría: {entry.category?.name} · {entry.type === 'income' ? 'Ingreso' : 'Gasto'} · {format.euro(entry.amount)}
                                        </Typography>
                                  }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })
              )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default YieldSettlementsTable
