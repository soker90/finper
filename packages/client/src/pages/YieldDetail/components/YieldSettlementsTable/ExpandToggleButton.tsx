import { IconButton } from '@mui/material'
import { DownOutlined, UpOutlined } from '@ant-design/icons'

interface Props {
  isOpen: boolean
  label: string
  onToggle: () => void
}

/** Chevron icon button used to expand/collapse a settlement or annual row. */
const ExpandToggleButton = ({ isOpen, label, onToggle }: Props) => (
  <IconButton
    size='small'
    onClick={(e) => { e.stopPropagation(); onToggle() }}
    aria-label={`${isOpen ? 'Contraer' : 'Expandir'} ${label}`}
    aria-expanded={isOpen}
  >
    {isOpen ? <UpOutlined /> : <DownOutlined />}
  </IconButton>
)

export default ExpandToggleButton
