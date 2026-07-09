import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { mutate } from 'swr'
import {
  Stack, Box, Typography, Chip, Grid, IconButton, Button,
  Avatar, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Collapse, List, ListItem, ListItemText, Tooltip,
  CircularProgress
} from '@mui/material'
import {
  ArrowLeftOutlined, EditOutlined, SearchOutlined, BankOutlined,
  ShoppingOutlined, DownOutlined, UpOutlined, CalendarOutlined,
  PercentageOutlined, RiseOutlined, ReconciliationOutlined, DeleteOutlined
} from '@ant-design/icons'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, Cell
} from 'recharts'

import MainCard from 'components/MainCard'
import { format } from 'utils'
import { YIELDS } from 'constants/api-paths'
import { useAccounts } from 'hooks/useAccounts'
import { useYield, useYields } from 'hooks/useYields'
import { unlinkYieldTransaction } from 'services/apiService'
import KpiCard from '../Dashboard/components/KpiCard'
import { useChartColors } from '../Dashboard/components/shared'
import YieldForm from '../Yields/components/YieldForm'
import LinkTransactionsModal from '../Yields/components/LinkTransactionsModal'

const TYPE_LABEL: Record<string, string> = {
  interest: 'Intereses',
  cashback: 'Cashback'
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  interest: <BankOutlined />,
  cashback: <ShoppingOutlined />
}

const YieldDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const chartColors = useChartColors()

  const { yieldData, isLoading: loadingDetail, mutate: mutateDetail } = useYield(id)
  const { accounts } = useAccounts()
  const { updateYield } = useYields()

  const [showForm, setShowForm] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})

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

  const account = accounts.find((a) => a._id === yieldData.accountId)
  const currentBalance = account ? account.balance : 0

  // Calculate Last Month KPI
  const lastMonthRow = yieldData.monthlyRows[0]
  let lastMonthValue = '—'
  let lastMonthSubtitle = 'Sin movimientos'
  if (lastMonthRow) {
    if (yieldData.type === 'interest') {
      lastMonthValue = format.euro(lastMonthRow.net ?? 0)
      lastMonthSubtitle = `Neto en ${lastMonthRow.month}`
    } else {
      lastMonthValue = (lastMonthRow.percentage !== null && lastMonthRow.percentage !== undefined)
        ? `${format.number(lastMonthRow.percentage)}%`
        : '0%'
      lastMonthSubtitle = `% devuelto en ${lastMonthRow.month}`
    }
  }

  // Reverse monthly rows for the chart (oldest to newest)
  const chartData = [...yieldData.monthlyRows].reverse().map((row) => ({
    month: row.month,
    value: yieldData.type === 'interest' ? (row.net ?? 0) : (row.percentage ?? 0)
  }))

  const handleUnlink = async (transactionId: string) => {
    await unlinkYieldTransaction(yieldData._id, transactionId)
    await mutateDetail()
    mutate(YIELDS)
  }

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => ({ ...prev, [month]: !prev[month] }))
  }

  const tooltipFormatter = (value: unknown) => {
    if (yieldData.type === 'interest') {
      return format.euro(Number(value))
    }
    return `${format.number(Number(value))}%`
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
          <IconButton onClick={() => navigate('/rendimientos')} color='inherit'>
            <ArrowLeftOutlined />
          </IconButton>
          <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 44, height: 44 }}>
            {TYPE_ICON[yieldData.type]}
          </Avatar>
          <Box>
            <Typography variant='h3'>{yieldData.name}</Typography>
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
            onClick={() => setShowLinkModal(true)}
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
        </Stack>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Saldo actual cuenta'
            value={format.euro(currentBalance)}
            subtitle='Saldo de la cuenta vinculada'
            icon={<BankOutlined />}
            color='primary'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Neto acumulado'
            value={format.euro(yieldData.netAccumulated)}
            subtitle='Suma de todos los meses'
            icon={<RiseOutlined />}
            color='success'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Último mes'
            value={lastMonthValue}
            subtitle={lastMonthSubtitle}
            icon={yieldData.type === 'interest' ? <RiseOutlined /> : <PercentageOutlined />}
            color='warning'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Movimientos enlazados'
            value={String(yieldData.entriesCount)}
            subtitle='Total de transacciones'
            icon={<ReconciliationOutlined />}
            color='info'
          />
        </Grid>
      </Grid>

      {/* Chart */}
      {chartData.length > 0 && (
        <MainCard title='Histórico Mensual'>
          <Box sx={{ height: 300, mt: 2 }}>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey='month' tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip formatter={tooltipFormatter} labelFormatter={(label) => `Mes: ${label}`} />
                <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </MainCard>
      )}

      {/* Monthly Table */}
      <MainCard title='Detalle por Mes' content={false}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3 }} width={50} />
                <TableCell>Mes</TableCell>
                {yieldData.type === 'interest'
                  ? (
                    <>
                      <TableCell align='right'>Ingreso Bruto</TableCell>
                      <TableCell align='right'>Impuesto Retenido</TableCell>
                      <TableCell align='right'>Neto</TableCell>
                    </>
                    )
                  : (
                    <>
                      <TableCell align='right'>Recibos (Gastos)</TableCell>
                      <TableCell align='right'>Cashback Devuelto</TableCell>
                      <TableCell align='right'>% Devuelto</TableCell>
                    </>
                    )}
              </TableRow>
            </TableHead>
            <TableBody>
              {yieldData.monthlyRows.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center' sx={{ py: 3 }}>
                      <Typography color='textSecondary'>
                        No hay movimientos enlazados a este rendimiento. Usa el botón "Enlazar movimientos" para empezar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                  )
                : (
                    yieldData.monthlyRows.map((row) => {
                      const isOpen = Boolean(expandedMonths[row.month])
                      return (
                        <React.Fragment key={row.month}>
                          <TableRow
                            hover
                            onClick={() => toggleMonth(row.month)}
                            sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
                          >
                            <TableCell sx={{ pl: 3 }}>
                              <IconButton size='small'>
                                {isOpen ? <UpOutlined /> : <DownOutlined />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                                <CalendarOutlined style={{ opacity: 0.5 }} />
                                <span>{row.month}</span>
                              </Stack>
                            </TableCell>
                            {yieldData.type === 'interest'
                              ? (
                                <>
                                  <TableCell align='right'>{format.euro(row.grossIncome ?? 0)}</TableCell>
                                  <TableCell align='right' sx={{ color: 'error.main' }}>
                                    {row.taxExpense ? `-${format.euro(row.taxExpense)}` : '—'}
                                  </TableCell>
                                  <TableCell align='right' sx={{ fontWeight: 600, color: 'success.main' }}>
                                    {format.euro(row.net ?? 0)}
                                  </TableCell>
                                </>
                                )
                              : (
                                <>
                                  <TableCell align='right'>{format.euro(row.billsTotal ?? 0)}</TableCell>
                                  <TableCell align='right' sx={{ fontWeight: 600, color: 'success.main' }}>
                                    {format.euro(row.cashbackAmount ?? 0)}
                                  </TableCell>
                                  <TableCell align='right' sx={{ fontWeight: 600 }}>
                                    {(row.percentage !== null && row.percentage !== undefined)
                                      ? `${format.number(row.percentage)}%`
                                      : '—'}
                                  </TableCell>
                                </>
                                )}
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                              <Collapse in={isOpen} timeout='auto' unmountOnExit>
                                <Box sx={{ margin: 2, pl: 4 }}>
                                  <Typography variant='h6' gutterBottom component='div'>
                                    Movimientos del mes
                                  </Typography>
                                  <List dense disablePadding>
                                    {row.entries.map((entry) => (
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
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleUnlink(entry._id)
                                              }}
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
          onClose={() => setShowLinkModal(false)}
          onLinked={async () => {
            await mutateDetail()
            mutate(YIELDS)
          }}
        />
      )}
    </Stack>
  )
}

export default YieldDetail
