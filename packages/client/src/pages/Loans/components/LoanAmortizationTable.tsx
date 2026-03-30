import { useRef } from 'react'
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
import { useVirtualizer } from '@tanstack/react-virtual'
import { DeleteOutlined, EditOutlined, EuroCircleOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
import { format } from 'utils'
import { AmortizationRow, LoanPaymentType } from 'types'

/** Altura estimada de cada fila en píxeles (Table size='small'). */
const ROW_HEIGHT = 37
/** Altura máxima del contenedor antes de activar scroll. */
const MAX_TABLE_HEIGHT = 500
/** Número de filas renderizadas fuera del viewport visible. */
const OVERSCAN = 5

interface Props {
  rows: AmortizationRow[]
  onDeletePayment?: (row: AmortizationRow) => void
  onEditPayment?: (row: AmortizationRow) => void
  onPayPayment?: (row: AmortizationRow) => void
}

const LoanAmortizationTable = ({ rows, onDeletePayment, onEditPayment, onPayPayment }: Props) => {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const firstProjectedRow = onPayPayment ? rows.find(r => r.isProjected) : undefined

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  })

  const rowBackground = (row: AmortizationRow): string | undefined => {
    if (row.isProjected) return undefined
    if (row.type === LoanPaymentType.EXTRAORDINARY) return alpha(theme.palette.info.main, 0.08)
    return alpha(theme.palette.success.main, 0.08)
  }

  return (
    <MainCard title='Cuadro de amortización' sx={{ overflowX: 'auto' }}>
      <TableContainer
        ref={containerRef}
        sx={{ maxHeight: MAX_TABLE_HEIGHT, overflow: 'auto' }}
      >
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
            {virtualizer.getVirtualItems().length > 0 && (
              <TableRow style={{ height: virtualizer.getVirtualItems()[0].start }} />
            )}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              const textColor = row.isProjected ? 'textSecondary' : 'inherit'
              return (
                <TableRow
                  key={row._id ?? String(row.period)}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  sx={{ backgroundColor: rowBackground(row) }}
                >
                  <TableCell>
                    <Typography variant='body2' color={textColor}>
                      {row.period}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2' color={textColor}>
                      {format.date(row.date)}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color={textColor}>
                      {format.euro(row.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color={textColor}>
                      {format.euro(row.interest)}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color={textColor}>
                      {format.euro(row.principal)}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color={textColor}>
                      {format.euro(row.accumulatedPrincipal)}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Typography variant='body2' color={textColor}>
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
              )
            })}
            {virtualizer.getVirtualItems().length > 0 && (
              <TableRow style={{ height: virtualizer.getTotalSize() - virtualizer.getVirtualItems().at(-1)!.end }} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MainCard>
  )
}

export default LoanAmortizationTable
