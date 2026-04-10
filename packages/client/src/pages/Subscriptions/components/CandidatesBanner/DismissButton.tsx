import { IconButton, Tooltip } from '@mui/material'
import { CloseOutlined } from '@ant-design/icons'

type Props = {
  disabled?: boolean
  onClick: () => void
}

const DismissButton = ({ disabled, onClick }: Props) => (
  <Tooltip title='No es una suscripción'>
    <IconButton
      size='small'
      aria-label='No es una suscripción'
      disabled={disabled}
      onClick={onClick}
    >
      <CloseOutlined />
    </IconButton>
  </Tooltip>
)

export default DismissButton
