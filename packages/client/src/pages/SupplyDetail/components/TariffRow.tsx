import { useState } from 'react'
import {
  Box,
  Collapse,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Stack
} from '@mui/material'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { TariffComparison } from 'hooks/useTariffsComparison'
import { format } from 'utils'
import {
  TARIFF_ROW_LABELS,
  INVOICE_TABLE_COLUMNS
} from './TariffRow/config'
import {
  calculateSavings,
  getSavingsLabel,
  getRowBackground,
  getPriceTitleColor,
  getPriceTextColor,
  getSavingsColor
} from './TariffRow/helpers'

interface Props {
  row: TariffComparison
  isBest: boolean
}

const TariffRow = ({ row, isBest }: Props) => {
  const [open, setOpen] = useState(false)
  const savingsLabel = getSavingsLabel(row.estimatedAnnualSavings)

  const renderInvoiceRow = (invoice: TariffComparison['invoices'][0]) => {
    const { difference } = calculateSavings(
      invoice.currentTariffSimulatedAmount,
      invoice.newTariffSimulatedAmount
    )

    return (
      <TableRow key={invoice.startDate}>
        <TableCell component='th' scope='row'>
          <Typography variant='caption'>
            {format.dateShort(invoice.startDate)} - {format.dateShort(invoice.endDate)}
          </Typography>
        </TableCell>
        <TableCell align='right'>
          <Typography variant='caption'>{format.euro(invoice.realAmount)}</Typography>
        </TableCell>
        <TableCell align='right'>
          <Typography variant='caption' color='text.secondary'>
            {format.euro(invoice.currentTariffSimulatedAmount)}
          </Typography>
        </TableCell>
        <TableCell align='right'>
          <Typography variant='caption' fontWeight={700}>
            {format.euro(invoice.newTariffSimulatedAmount)}
          </Typography>
        </TableCell>
        <TableCell align='right'>
          <Typography
            variant='caption'
            fontWeight={700}
            color={getSavingsColor(difference)}
          >
            {format.euro(Math.abs(difference))}
          </Typography>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          cursor: 'pointer',
          ...getRowBackground(isBest)
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell width={40}>
          <IconButton
            aria-label='expand row'
            size='small'
            onClick={(e) => {
              e.stopPropagation()
              setOpen(!open)
            }}
          >
            {open ? <UpOutlined /> : <DownOutlined />}
          </IconButton>
        </TableCell>
        <TableCell component='th' scope='row'>
          <Stack>
            <Typography
              variant='subtitle1'
              fontWeight={getPriceTextColor(isBest)}
              color={getPriceTitleColor(isBest)}
            >
              {row.retailer}
            </Typography>
            <Stack direction='row' spacing={1} alignItems='center'>
              <Typography variant='body2' color='text.secondary'>
                {row.tariffName}
              </Typography>
              {row.discount && (
                <Chip
                  label={`${row.discount.tipo === 'porcentaje' ? '-' : ''}${row.discount.valor}${row.discount.tipo === 'porcentaje' ? '%' : '€'}${row.discount.meses ? ` / ${row.discount.meses}m` : ''}${row.discount.soloNuevosClientes ? ' ★nuevos' : ''}`}
                  size='small'
                  color='secondary'
                  variant='outlined'
                  sx={{ height: 16, fontSize: '0.65rem', fontWeight: 700 }}
                />
              )}
            </Stack>
          </Stack>
        </TableCell>
        <TableCell align='center'>
          <Stack spacing={0.5} alignItems='center'>
            <Typography variant='caption' fontWeight={600} sx={{ bgcolor: 'grey.100', px: 1, borderRadius: 1 }}>
              P: {row.peakPower} / {row.offPeakPower}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              E: {row.peakEnergy} / {row.flatEnergy} / {row.offPeakEnergy}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell align='right'>
          <Stack alignItems='flex-end'>
            <Typography variant='subtitle1' fontWeight={700}>
              {format.euro(row.estimatedAnnualTotal)}
            </Typography>
            {row.firstYearTotal !== null && (
              <Typography variant='caption' color='secondary' fontWeight={700}>
                1er año: {format.euro(row.firstYearTotal)}
              </Typography>
            )}
          </Stack>
        </TableCell>
        <TableCell align='right'>
          <Typography
            variant='h6'
            component='span'
            fontWeight={700}
            color={getSavingsColor(row.estimatedAnnualSavings)}
          >
            {savingsLabel === 'saving' ? '+' : ''}
            {format.euro(row.estimatedAnnualSavings)}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout='auto' unmountOnExit>
            <Box sx={{ margin: 2, bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
              <Typography variant='subtitle2' gutterBottom component='div' fontWeight={700}>
                {TARIFF_ROW_LABELS.projectionTitle}
              </Typography>
              <Table size='small' aria-label='invoices'>
                <TableHead>
                  <TableRow>
                    {INVOICE_TABLE_COLUMNS.map((column) => (
                      <TableCell key={column.id} align={column.align}>
                        <Typography variant='caption' fontWeight={700}>
                          {column.label}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.invoices.map(renderInvoiceRow)}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default TariffRow
