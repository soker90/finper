import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  useTheme
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { DeleteOutlined, EditOutlined, EuroCircleOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
import { format } from 'utils'
import { AmortizationRow, LoanPaymentType } from 'types'

interface Props {
  rows: AmortizationRow[]
  onDeletePayment?: (row: AmortizationRow) => void
  onEditPayment?: (row: AmortizationRow) => void
  onPayPayment?: (row: AmortizationRow) => void
}

const LoanAmortizationTable = ({ rows, onDeletePayment, onEditPayment, onPayPayment }: Props) => {
  const theme = useTheme()
  const firstProjectedRow = onPayPayment ? rows.find(r => r.isProjected) : undefined

  const rowBackground = (row: AmortizationRow): string | undefined => {
    if (row.isProjected) return undefined
    if (row.type === LoanPaymentType.EXTRAORDINARY) return alpha(theme.palette.info.main, 0.08)
    return alpha(theme.palette.success.main, 0.08)
  }

  return (
    <MainCard title='Cuadro de amortización' sx={{ overflowX: 'auto' }}>
      <TableContainer>
        <Table size='small' stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Periodo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align='right'>Cuota</TableCell>
              <TableCell align='right'>Intereses</TableCell>
              <TableCell align='right'>Amortización</TableCell>
              <TableCell align='right'>Amort. acumulada</TableCell>
              <TableCell align='right'>Capital pendiente</TableCell>
              {(onDeletePayment || onEditPayment || onPayPayment) && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={`${row.period}-${row.date}`}
                sx={{ backgroundColor: rowBackground(row) }}
              >
                <TableCell>
                  <Typography variant='body2' color={row.isProjected ? 'textSecondary' : 'inherit'}>
                    {row.period}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='body2' color={row.isProjected ? 'textSecondary' : 'inherit'}>
                    {new Date(row.date).toLocaleDateString('es-ES')}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' color={row.isProjected ? 'textSecondary' : 'inherit'}>
                    {format.euro(row.amount)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' color={row.isProjected ? 'textSecondary' : 'inherit'}>
                    {format.euro(row.interest)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' color={row.isProjected ? 'textSecondary' : 'inherit'}>
                    {format.euro(row.principal)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' color={row.isProjected ? 'textSecondary' : 'inherit'}>
                    {format.euro(row.accumulatedPrincipal)}
                  </Typography>
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' color={row.isProjected ? 'textSecondary' : 'inherit'}>
                    {format.euro(row.pendingCapital)}
                  </Typography>
                </TableCell>
                {(onDeletePayment || onEditPayment || onPayPayment) && (
                  <TableCell>
                    <Stack direction='row' spacing={0}>
                      {!row.isProjected && onEditPayment && (
                        <Tooltip title='Editar pago'>
                          <IconButton
                            size='small'
                            color='primary'
                            onClick={() => onEditPayment(row)}
                          >
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!row.isProjected && onDeletePayment && (
                        <Tooltip title='Eliminar pago'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => onDeletePayment(row)}
                          >
                            <DeleteOutlined />
                          </IconButton>
                        </Tooltip>
                      )}
                      {row.isProjected && firstProjectedRow && row === firstProjectedRow && onPayPayment && (
                        <Tooltip title='Pagar cuota'>
                          <IconButton
                            size='small'
                            color='success'
                            onClick={() => onPayPayment(row)}
                          >
                            <EuroCircleOutlined />
                          </IconButton>
                        </Tooltip>
                      )}

                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MainCard>
  )
}

export default LoanAmortizationTable
