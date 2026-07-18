import { Box, Tooltip } from '@mui/material'
import { ExclamationCircleOutlined } from '@ant-design/icons'

const NoIncomeWarning = () => (
  <Tooltip title='Esta liquidación no tiene ningún movimiento de ingreso enlazado'>
    <Box component='span' sx={{ color: 'warning.main', display: 'inline-flex', alignItems: 'center' }}>
      <ExclamationCircleOutlined />
    </Box>
  </Tooltip>
)

export default NoIncomeWarning
