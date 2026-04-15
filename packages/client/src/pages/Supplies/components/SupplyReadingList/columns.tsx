import { ReactNode } from 'react'
import { Typography } from '@mui/material'
import dayjs from 'dayjs'

import { SupplyReading } from 'types'
import { format } from 'utils'

export interface ColumnDef {
  id: string
  label: string
  align?: 'left' | 'right'
  render: (reading: SupplyReading) => ReactNode
}

interface ColumnContext {
  isElectricity: boolean
  unit: string
}

export const getColumns = ({ isElectricity, unit }: ColumnContext): ColumnDef[] => {
  const consumptionCols: ColumnDef[] = isElectricity
    ? [
        { id: 'peak', label: 'Punta (kWh)', align: 'right', render: (reading) => reading.consumptionPeak ?? '—' },
        { id: 'flat', label: 'Llano (kWh)', align: 'right', render: (reading) => reading.consumptionFlat ?? '—' },
        { id: 'offPeak', label: 'Valle (kWh)', align: 'right', render: (reading) => reading.consumptionOffPeak ?? '—' }
      ]
    : [
        {
          id: 'consumption',
          label: `Consumo${unit ? ` (${unit})` : ''}`,
          align: 'right',
          render: (reading) => reading.consumption ?? '—'
        }
      ]

  return [
    {
      id: 'startDate',
      label: 'Inicio',
      render: (reading) => dayjs(reading.startDate).format('DD/MM/YYYY')
    },
    {
      id: 'endDate',
      label: 'Fin',
      render: (reading) => dayjs(reading.endDate).format('DD/MM/YYYY')
    },
    ...consumptionCols,
    {
      id: 'amount',
      label: 'Importe',
      align: 'right',
      render: (reading) =>
        Number.isFinite(reading.amount)
          ? (
            <Typography component='span' color={reading.amount < 0 ? 'error.main' : 'text.primary'}>
              {format.euro(reading.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            )
          : '—'
    }
  ]
}
