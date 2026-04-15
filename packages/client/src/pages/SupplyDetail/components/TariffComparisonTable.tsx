import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { TariffComparison } from 'hooks/useTariffsComparison'
import TariffRow from './TariffRow'

interface Props {
  comparison: TariffComparison[] | undefined
  isLoading: boolean
}

const SKELETON_ROWS = 5

const TariffComparisonTable = ({ comparison, isLoading }: Props) => (
  <Box>
    <Typography variant='h5' fontWeight={700} gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      Comparativa Detallada
      <Chip label={`${comparison?.length ?? 0} tarifas analizadas`} size='small' variant='outlined' />
    </Typography>

    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell width={40} sx={{ bgcolor: 'grey.50' }} />
            <TableCell sx={{ bgcolor: 'grey.50' }}>
              <Typography variant='subtitle2' fontWeight='700'>Tarifa / Comercializadora</Typography>
            </TableCell>
            <TableCell align='center' sx={{ bgcolor: 'grey.50' }}>
              <Typography variant='subtitle2' fontWeight='700'>Potencia / Energía</Typography>
            </TableCell>
            <TableCell align='right' sx={{ bgcolor: 'grey.50' }}>
              <Typography variant='subtitle2' fontWeight='700'>Ahorro Anual Estimado</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading
            ? Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell colSpan={4} sx={{ py: 2 }}>
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
                  <TableCell colSpan={4} align='center' sx={{ py: 8 }}>
                    <Typography color='text.secondary'>No se han encontrado comparativas disponibles.</Typography>
                  </TableCell>
                </TableRow>
                )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
)

export default TariffComparisonTable
