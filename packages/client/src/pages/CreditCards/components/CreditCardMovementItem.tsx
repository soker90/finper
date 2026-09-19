import { FC, useState } from 'react'
import { Chip, Collapse, Divider, Paper, Stack, Typography } from '@mui/material'
import { CreditCardOutlined } from '@ant-design/icons'

import { BankIcon, ItemContent } from 'components'
import { AMOUNT_COLORS, TRANSACTION_SYMBOL } from 'constants/transactions'
import { format } from 'utils'
import { CreditCardMovementEdit } from './CreditCardMovementEdit'
import type { CreditCardMovement } from 'types'

interface CreditCardMovementItemProps {
  movement: CreditCardMovement
  bank?: string | null
}

// Mismo patrón de fila expandible que TransactionItem: al hacer clic se
// despliega el formulario de edición en lugar de abrir un modal.
export const CreditCardMovementItem: FC<CreditCardMovementItemProps> = ({ movement, bank }) => {
  const [expand, setExpand] = useState(false)

  return (
    <Paper component='li'>
      <ItemContent onClick={() => setExpand((toggle) => !toggle)} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        <Stack
          direction='row' spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 160 }}
        >
          {bank
            ? <BankIcon name={bank} width={32} height={32} />
            : <CreditCardOutlined style={{ fontSize: 32, marginRight: '1rem' }} />}
          <Typography variant='body2'>
            {format.dateShort(movement.date)}
          </Typography>
        </Stack>

        <Stack
          direction='row' spacing={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap', pr: { xs: 0, md: '50%' } }}
        >
          <Typography variant='body1'>{movement.category?.name}</Typography>
          {movement.splits && movement.splits.length >= 2 && (
            <Chip
              label={`Dividida (${movement.splits.length} categorías)`}
              size='small'
              color='info'
              variant='outlined'
            />
          )}
          {movement.store?.name && <Typography variant='body1'>({movement.store.name})</Typography>}
          {(movement.splits && movement.splits.length >= 2
            ? [...new Set(movement.splits.flatMap(split => split.tags ?? []))]
            : (movement.tags ?? [])
          ).map((tag) => (
            <Chip key={tag} label={tag} size='small' variant='outlined' />
          ))}
        </Stack>

        <Typography
          variant='h4'
          color={AMOUNT_COLORS[movement.type]}
        >
          {TRANSACTION_SYMBOL[movement.type]}{format.euro(movement.amount)}
        </Typography>
      </ItemContent>

      <Collapse in={expand} timeout='auto' unmountOnExit>
        <Divider />
        <CreditCardMovementEdit movement={movement} hideForm={() => setExpand(false)} />
      </Collapse>
    </Paper>
  )
}
