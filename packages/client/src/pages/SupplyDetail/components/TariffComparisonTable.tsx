import {
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { MainCard } from 'components'
import { TariffComparison } from 'hooks/useTariffsComparison'
import TariffRow from './TariffRow'

interface Props {
  comparison: TariffComparison[] | undefined
  isLoading: boolean
}

const SKELETON_ROWS = 5

const HEADER_COLUMNS = [
  { id: 'expand', label: '', align: 'left' as const, width: 40 },
  { id: 'tariff', label: 'Tarifa / Comercializadora', align: 'left' as const },
  { id: 'power', label: 'Potencia / Energía', align: 'center' as const },
  { id: 'savings', label: 'Ahorro Anual Estimado', align: 'right' as const }
]

const TariffComparisonTable = ({ comparison, isLoading }: Props) => (
  <MainCard
    title='Comparativa Detallada'
    secondary={<Chip label={`${comparison?.length ?? 0} tarifas analizadas`} size='small' variant='outlined' />}
    content={false}
  >
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {HEADER_COLUMNS.map((column) => (
              <TableCell key={column.id} align={column.align} width={column.width} sx={{ bgcolor: 'grey.50' }}>
                {column.label && (
                  <Typography variant='subtitle2' fontWeight='700'>{column.label}</Typography>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading
            ? Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell colSpan={HEADER_COLUMNS.length} sx={{ py: 2 }}>
                  <Skeleton variant='text' height={40} />
                </TableCell>
              </TableRow>
            ))
            : comparison && comparison.length > 0
              ? comparison.map((row, index) => (
                <TariffRow
                  key={`${row.retailer}-${row.tariffName}`}
                  row={row}
                  isBest={index === 0}
                />
              ))
              : (
                <TableRow>
                  <TableCell colSpan={HEADER_COLUMNS.length} align='center' sx={{ py: 8 }}>
                    <Typography color='text.secondary'>No se han encontrado comparativas disponibles.</Typography>
                  </TableCell>
                </TableRow>
                )}
        </TableBody>
      </Table>
    </TableContainer>
  </MainCard>
)

export default TariffComparisonTable
