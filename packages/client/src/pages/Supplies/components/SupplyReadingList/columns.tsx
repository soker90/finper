import { ReactNode } from 'react'
import { Typography } from '@mui/material'
import dayjs from 'dayjs'
import { Column } from 'components/ScrollableTable'
import { SupplyReading } from 'types'
import { format } from 'utils'

interface ColumnContext {
  isElectricity: boolean
  unit: string
}

export const getColumns = ({ isElectricity, unit }: ColumnContext): Column<SupplyReading>[] => {
  const consumptionCols: Column<SupplyReading>[] = isElectricity
    ? [
        { id: 'peak', label: 'Punta (kWh)', align: 'right', render: (r) => r.consumptionPeak ?? '—' },
        { id: 'flat', label: 'Llano (kWh)', align: 'right', render: (r) => r.consumptionFlat ?? '—' },
        { id: 'offPeak', label: 'Valle (kWh)', align: 'right', render: (r) => r.consumptionOffPeak ?? '—' }
      ]
    : [
        {
          id: 'consumption',
          label: `Consumo${unit ? ` (${unit})` : ''}`,
          align: 'right',
          render: (r) => r.consumption ?? '—'
        }
      ]

  return [
    {
      id: 'startDate',
      label: 'Inicio',
      render: (r) => dayjs(r.startDate).format('DD/MM/YYYY')
    },
    {
      id: 'endDate',
      label: 'Fin',
      render: (r) => dayjs(r.endDate).format('DD/MM/YYYY')
    },
    ...consumptionCols,
    {
      id: 'amount',
      label: 'Importe',
      align: 'right',
      render: (r): ReactNode =>
        Number.isFinite(r.amount)
          ? (
            <Typography component='span' color={r.amount < 0 ? 'error.main' : 'text.primary'}>
              {format.euro(r.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            )
          : '—'
    }
  ]
}
