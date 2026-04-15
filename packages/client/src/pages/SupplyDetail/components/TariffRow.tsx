import { useState } from 'react'
import {
  Box,
  Collapse,
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

interface Props {
  row: TariffComparison
  isBest: boolean
}

const TariffRow = ({ row, isBest }: Props) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          cursor: 'pointer',
          bgcolor: isBest ? 'success.lighter' : 'inherit',
          '&:hover': { bgcolor: isBest ? 'success.lighter' : 'action.hover' }
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
            <Typography variant='subtitle1' fontWeight={isBest ? 700 : 600} color={isBest ? 'success.main' : 'text.primary'}>
              {row.comercializadora}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {row.nombreTarifa}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell align='center'>
          <Stack spacing={0.5} alignItems='center'>
            <Typography variant='caption' fontWeight={600} sx={{ bgcolor: 'grey.100', px: 1, borderRadius: 1 }}>
              P: {row.potenciaPunta} / {row.potenciaValle}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              E: {row.energiaPunta} / {row.energiaLlana} / {row.energiaValle}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell align='right'>
          <Typography variant='h6' component='span' fontWeight={700} color={row.ahorroAnualEstimado > 0 ? 'success.main' : 'error.main'}>
            {row.ahorroAnualEstimado > 0 ? 'Ahorro: ' : 'Coste: '}{format.euro(Math.abs(row.ahorroAnualEstimado))}/año
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout='auto' unmountOnExit>
            <Box sx={{ margin: 2, bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
              <Typography variant='subtitle2' gutterBottom component='div' fontWeight={700}>
                Análisis de Proyección (Triple Comparativa)
              </Typography>
              <Table size='small' aria-label='invoices'>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant='caption' fontWeight={700}>Periodo</Typography></TableCell>
                    <TableCell align='right'><Typography variant='caption' fontWeight={700}>Pagado Banco</Typography></TableCell>
                    <TableCell align='right'><Typography variant='caption' fontWeight={700}>Coste Hoy (Tu Tarifa)</Typography></TableCell>
                    <TableCell align='right'><Typography variant='caption' fontWeight={700}>Coste Hoy (Nueva Tarifa)</Typography></TableCell>
                    <TableCell align='right'><Typography variant='caption' fontWeight={700}>Ahorro</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.invoices.map((invoice) => {
                    const diff = invoice.currentTariffSimulatedAmount - invoice.newTariffSimulatedAmount
                    const isSaving = diff > 0
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
                          <Typography variant='caption' color='text.secondary'>{format.euro(invoice.currentTariffSimulatedAmount)}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography variant='caption' fontWeight={700}>{format.euro(invoice.newTariffSimulatedAmount)}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography
                            variant='caption'
                            fontWeight={700}
                            color={isSaving ? 'success.main' : 'error.main'}
                          >
                            {format.euro(Math.abs(diff))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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
