import { type ReactNode } from 'react'
import { Box, Stack, Typography, Avatar, IconButton, Tooltip, Chip } from '@mui/material'
import { EditOutlined, DeleteOutlined, SearchOutlined, BankOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Yield } from 'types'

type Props = {
  item: Yield
  onEdit: (y: Yield) => void
  onDelete: (y: Yield) => void
  onSearchTransactions: (y: Yield) => void
}

const TYPE_LABEL: Record<string, string> = {
  interest: 'Remunerada',
  cashback: 'Cashback'
}

const TYPE_ICON: Record<string, ReactNode> = {
  interest: <BankOutlined />,
  cashback: <ShoppingOutlined />
}

const YieldCardHeader = ({ item, onEdit, onDelete, onSearchTransactions }: Props) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}
  >
    <Stack
      direction='row'
      spacing={1}
      sx={{
        alignItems: 'center',
        minWidth: 0
      }}
    >
      <Avatar
        sx={{ width: 32, height: 32, bgcolor: 'primary.lighter', color: 'primary.main', fontSize: 14 }}
      >
        {TYPE_ICON[item.type]}
      </Avatar>
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography variant='h6' color='textSecondary' noWrap>
          {item.account.name} - {TYPE_LABEL[item.type] ?? item.type}
        </Typography>
        <Chip label={TYPE_LABEL[item.type] ?? item.type} size='small' sx={{ height: 18, fontSize: 11, alignSelf: 'flex-start' }} />
      </Stack>
    </Stack>

    <Stack direction='row' spacing={0.5}>
      <Tooltip title='Enlazar movimientos'>
        <IconButton size='small' color='primary' aria-label='Enlazar movimientos' onClick={() => onSearchTransactions(item)}>
          <SearchOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title='Editar'>
        <IconButton size='small' aria-label='Editar' onClick={() => onEdit(item)}>
          <EditOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title='Eliminar'>
        <IconButton size='small' color='error' aria-label='Eliminar' onClick={() => onDelete(item)}>
          <DeleteOutlined />
        </IconButton>
      </Tooltip>
    </Stack>
  </Box>
)

export default YieldCardHeader
