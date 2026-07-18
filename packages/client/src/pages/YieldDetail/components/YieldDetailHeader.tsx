import { ReactNode } from 'react'
import { Stack, Box, Typography, Chip, IconButton, Button, Avatar } from '@mui/material'
import {
  ArrowLeftOutlined, EditOutlined, SearchOutlined, BankOutlined,
  ShoppingOutlined, DeleteOutlined
} from '@ant-design/icons'
import { YieldDetail } from 'types'

const TYPE_LABEL: Record<string, string> = {
  interest: 'Remunerada',
  cashback: 'Cashback'
}

const TYPE_ICON: Record<string, ReactNode> = {
  interest: <BankOutlined />,
  cashback: <ShoppingOutlined />
}

interface Props {
  yieldData: YieldDetail
  onBack: () => void
  onSearchTransactions: () => void
  onEdit: () => void
  onDelete: () => void
}

const YieldDetailHeader = ({ yieldData, onBack, onSearchTransactions, onEdit, onDelete }: Props) => (
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
      <IconButton onClick={onBack} color='inherit' aria-label='Volver'>
        <ArrowLeftOutlined />
      </IconButton>
      <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 44, height: 44 }}>
        {TYPE_ICON[yieldData.type]}
      </Avatar>
      <Box>
        <Typography variant='h3'>{yieldData.account.name} - {TYPE_LABEL[yieldData.type] ?? yieldData.type}</Typography>
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
      <Button variant='outlined' startIcon={<SearchOutlined />} onClick={onSearchTransactions}>
        Enlazar movimientos
      </Button>
      <Button variant='contained' startIcon={<EditOutlined />} onClick={onEdit}>
        Editar
      </Button>
      <Button variant='outlined' color='error' startIcon={<DeleteOutlined />} onClick={onDelete}>
        Eliminar
      </Button>
    </Stack>
  </Stack>
)

export default YieldDetailHeader
