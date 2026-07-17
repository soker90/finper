import React, { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Collapse, Box, Typography, List, ListItem,
  ListItemText, Tooltip, IconButton, Stack, Chip
} from '@mui/material'
import {
  DownOutlined, UpOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined
} from '@ant-design/icons'
import { format } from 'utils'
import { YieldDetail, YieldSettlement } from 'types'

interface Props {
  yieldData: YieldDetail
  viewMode?: 'settlement' | 'annual'
  onEditSettlement: (settlement: YieldSettlement) => void
  onLinkToSettlement: (settlement: YieldSettlement) => void
  onUnlinkTransaction: (transactionId: string) => void
}

const YieldSettlementsTable = ({ yieldData, viewMode = 'settlement', onEditSettlement, onLinkToSettlement, onUnlinkTransaction }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (viewMode === 'annual') {
    const annualBreakdown = yieldData.annualBreakdown ?? []

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }} width={50} />
              <TableCell>Año</TableCell>
              {yieldData.type === 'interest'
                ? (
                  <>
                    <TableCell align='right'>Ingreso Bruto</TableCell>
                    <TableCell align='right'>Impuesto Retenido</TableCell>
                    <TableCell align='right'>Neto Anual</TableCell>
                    <TableCell align='right'>TAE (%)</TableCell>
                    <TableCell align='right'>Liquidaciones</TableCell>
                  </>
                  )
                : (
                  <>
                    <TableCell align='right'>Recibos Totales</TableCell>
                    <TableCell align='right'>Cashback Bruto</TableCell>
                    <TableCell align='right'>Retención</TableCell>
                    <TableCell align='right'>Cashback Neto</TableCell>
                    <TableCell align='right'>% Devuelto</TableCell>
                  </>
                  )}
            </TableRow>
          </TableHead>
          <TableBody>
            {annualBreakdown.map((stat) => {
              const year = stat.year
              const grossIncome = stat.grossIncome ?? 0
              const taxExpense = stat.taxExpense ?? 0
              const net = stat.net ?? 0
              const billsTotal = stat.billsTotal ?? 0
              const cashbackAmount = stat.cashbackAmount ?? 0
              const isYearExpanded = Boolean(expanded[`year-${year}`])
              const list = yieldData.settlements.filter(s => {
                const y = s.settlementDate ? new Date(s.settlementDate).getFullYear() : new Date().getFullYear()
                return y === year
              })

              return (
                <React.Fragment key={year}>
                  <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => toggle(`year-${year}`)}>
                    <TableCell sx={{ pl: 3 }}>
                      <IconButton size='small' onClick={(e) => { e.stopPropagation(); toggle(`year-${year}`) }}>
                        {isYearExpanded ? <UpOutlined /> : <DownOutlined />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>{year}</Typography>
                      <Typography variant='caption' color='textSecondary'>{stat.settlementsCount} liquidación{stat.settlementsCount === 1 ? '' : 'es'}</Typography>
                    </TableCell>
                    {yieldData.type === 'interest'
                      ? (
                        <>
                          <TableCell align='right'>{format.euro(grossIncome)}</TableCell>
                          <TableCell align='right'>{format.euro(taxExpense)}</TableCell>
                          <TableCell align='right'><Typography sx={{ fontWeight: 600 }} color='primary'>{format.euro(net)}</Typography></TableCell>
                          <TableCell align='right'>{stat.weightedTae !== null && stat.weightedTae !== undefined ? `${format.number(stat.weightedTae)}%` : '—'}</TableCell>
                          <TableCell align='right'>{stat.settlementsCount}</TableCell>
                        </>
                        )
                      : (
                        <>
                          <TableCell align='right'>{format.euro(billsTotal)}</TableCell>
                          <TableCell align='right'>{format.euro(grossIncome)}</TableCell>
                          <TableCell align='right'>{format.euro(taxExpense)}</TableCell>
                          <TableCell align='right'><Typography sx={{ fontWeight: 600 }} color='primary'>{format.euro(cashbackAmount)}</Typography></TableCell>
                          <TableCell align='right'>
                            <Typography sx={{ fontWeight: 600 }} color='primary'>
                              {stat.percentage !== null && stat.percentage !== undefined ? `${format.number(stat.percentage)}%` : '—'}
                            </Typography>
                          </TableCell>
                        </>
                        )}
                  </TableRow>
                  {isYearExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 0, bgcolor: 'action.hover' }}>
                        <Collapse in={isYearExpanded} timeout='auto' unmountOnExit>
                          <Box sx={{ margin: 2, pl: 4 }}>
                            <Typography variant='h6' gutterBottom component='div'>
                              Liquidaciones del año
                            </Typography>
                            <List dense disablePadding>
                              {list.map((s, idx) => {
                                const isPending = s.status === 'pending' || !s.settlementDate
                                const label = !isPending
                                  ? (format.monthYear(s.settlementDate!) ?? `Liq. #${idx + 1}`)
                                  : 'Pendiente de abono'
                                const amount = yieldData.type === 'interest' ? (s.net ?? 0) : (s.cashbackAmount ?? 0)

                                const sPercentage = s.percentage !== null && s.percentage !== undefined
                                  ? `${format.number(s.percentage)}%`
                                  : (s.billsTotal ?? 0) > 0 && (s.cashbackAmount ?? 0) > 0
                                      ? `${format.number(((s.cashbackAmount ?? 0) / (s.billsTotal ?? 0)) * 100)}%`
                                      : null

                                const secondaryParts = [`${s.entries?.length ?? 0} movimiento${(s.entries?.length ?? 0) === 1 ? '' : 's'}`]
                                if (yieldData.type === 'cashback') {
                                  if (sPercentage) {
                                    secondaryParts.push(`% devuelto: ${sPercentage}`)
                                  } else if (s.status === 'pending') {
                                    secondaryParts.push('% devuelto: Pendiente')
                                  }
                                } else if (yieldData.type === 'interest' && s.tae) {
                                  secondaryParts.push(`TAE: ${format.number(s.tae)}%`)
                                }

                                return (
                                  <ListItem
                                    key={s.id}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      mb: 1,
                                      bgcolor: 'background.paper',
                                      pr: 2
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {label}
                                          </Typography>
                                          {s.warning === 'no_income' && (
                                            <Tooltip title='Esta liquidación no tiene ningún movimiento de ingreso enlazado'>
                                              <Box component='span' sx={{ color: 'warning.main', display: 'inline-flex', alignItems: 'center' }}>
                                                <ExclamationCircleOutlined />
                                              </Box>
                                            </Tooltip>
                                          )}
                                        </Stack>
                                      }
                                      secondary={
                                        <Typography variant='caption' color='textSecondary'>
                                          {secondaryParts.join(' · ')}
                                        </Typography>
                                      }
                                    />
                                    <Typography variant='body2' sx={{ fontWeight: 600, color: 'success.main' }}>
                                      {format.euro(amount)}
                                    </Typography>
                                  </ListItem>
                                )
                              })}
                            </List>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )
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
                  <TableCell align='right'>Cashback Bruto</TableCell>
                  <TableCell align='right'>Retención</TableCell>
                  <TableCell align='right'>Cashback Neto</TableCell>
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
                <TableCell colSpan={8} align='center' sx={{ py: 3 }}>
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
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                            <span>{label}</span>
                            {settlement.warning === 'no_income' && (
                              <Tooltip title='Esta liquidación no tiene ningún movimiento de ingreso enlazado'>
                                <Box component='span' sx={{ color: 'warning.main', display: 'inline-flex', alignItems: 'center' }}>
                                  <ExclamationCircleOutlined />
                                </Box>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
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
                              <TableCell align='right'>{format.euro(settlement.grossIncome ?? settlement.cashbackAmount ?? 0)}</TableCell>
                              <TableCell align='right' sx={{ color: 'error.main' }}>
                                {settlement.taxExpense ? `-${format.euro(settlement.taxExpense)}` : '—'}
                              </TableCell>
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
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
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
