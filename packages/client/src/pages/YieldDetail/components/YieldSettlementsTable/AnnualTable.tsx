import React, { useState } from 'react'
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Collapse, Box, Typography, List, ListItem,
  ListItemText, Stack, IconButton
} from '@mui/material'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { YieldDetail } from 'types'
import { getSettlementYear } from '../../utils'
import NoIncomeWarning from './NoIncomeWarning'
import EmptyRow from './EmptyRow'

type Props = {
  yieldData: YieldDetail
}

const AnnualTable = ({ yieldData }: Props) => {
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({})
  const toggleYear = (year: number) => setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }))

  const annualBreakdown = yieldData.annualBreakdown ?? []
  const colSpan = yieldData.type === 'interest' ? 7 : 5

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
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
                  <TableCell align='right'>Cashback Neto</TableCell>
                  <TableCell align='right'>% Devuelto</TableCell>
                </>
                )}
          </TableRow>
        </TableHead>
        <TableBody>
          {annualBreakdown.length === 0
            ? <EmptyRow colSpan={colSpan + 1} message='No hay liquidaciones cerradas todavía para mostrar un desglose anual.' />
            : annualBreakdown.map((stat) => {
              const { year } = stat
              const isYearExpanded = Boolean(expandedYears[year])
              const settlementsInYear = yieldData.settlements.filter((settlement) => getSettlementYear(settlement) === year)

              return (
                <React.Fragment key={year}>
                  <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => toggleYear(year)}>
                    <TableCell sx={{ pl: 3 }}>
                      <IconButton
                        size='small'
                        onClick={(e) => { e.stopPropagation(); toggleYear(year) }}
                        aria-label={`${isYearExpanded ? 'Contraer' : 'Expandir'} año ${year}`}
                        aria-expanded={isYearExpanded}
                      >
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
                          <TableCell align='right'>{format.euro(stat.grossIncome ?? 0)}</TableCell>
                          <TableCell align='right'>{format.euro(stat.taxExpense ?? 0)}</TableCell>
                          <TableCell align='right'><Typography sx={{ fontWeight: 600 }} color='primary'>{format.euro(stat.net ?? 0)}</Typography></TableCell>
                          <TableCell align='right'>{stat.weightedTae !== null && stat.weightedTae !== undefined ? `${format.number(stat.weightedTae)}%` : '—'}</TableCell>
                          <TableCell align='right'>{stat.settlementsCount}</TableCell>
                        </>
                        )
                      : (
                        <>
                          <TableCell align='right'>{format.euro(stat.billsTotal ?? 0)}</TableCell>
                          <TableCell align='right'><Typography sx={{ fontWeight: 600 }} color='primary'>{format.euro(stat.cashbackAmount ?? 0)}</Typography></TableCell>
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
                      <TableCell colSpan={colSpan} sx={{ py: 0, bgcolor: 'action.hover' }}>
                        <Collapse in={isYearExpanded} timeout='auto' unmountOnExit>
                          <Box sx={{ margin: 2, pl: 4 }}>
                            <Typography variant='h6' gutterBottom component='div'>
                              Liquidaciones del año
                            </Typography>
                            <List dense disablePadding>
                              {settlementsInYear.map((settlement, idx) => {
                                const isPending = settlement.status === 'pending' || !settlement.settlementDate
                                const label = !isPending
                                  ? (format.monthYear(settlement.settlementDate!) ?? `Liq. #${idx + 1}`)
                                  : 'Pendiente de abono'
                                const amount = yieldData.type === 'interest' ? (settlement.net ?? 0) : (settlement.cashbackAmount ?? 0)

                                const percentageLabel = settlement.percentage !== null && settlement.percentage !== undefined
                                  ? `${format.number(settlement.percentage)}%`
                                  : null

                                const secondaryParts = [`${settlement.entries?.length ?? 0} movimiento${(settlement.entries?.length ?? 0) === 1 ? '' : 's'}`]
                                if (yieldData.type === 'cashback') {
                                  if (percentageLabel) {
                                    secondaryParts.push(`% devuelto: ${percentageLabel}`)
                                  } else if (settlement.status === 'pending') {
                                    secondaryParts.push('% devuelto: Pendiente')
                                  }
                                } else if (yieldData.type === 'interest' && settlement.tae) {
                                  secondaryParts.push(`TAE: ${format.number(settlement.tae)}%`)
                                }

                                return (
                                  <ListItem
                                    key={settlement.id}
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
                                          {settlement.warning === 'no_income' && <NoIncomeWarning />}
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

export default AnnualTable
