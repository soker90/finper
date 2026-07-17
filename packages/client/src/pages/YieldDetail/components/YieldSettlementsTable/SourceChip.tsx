import { Chip, Tooltip } from '@mui/material'

type Props = {
  source?: 'provided' | 'calculated' | null
}

/** "introd." / "calc." badge shown next to a TAE or average balance value. */
const SourceChip = ({ source }: Props) => (
  <Tooltip title={source === 'provided' ? 'Valor introducido' : 'Valor calculado automáticamente'}>
    <Chip
      label={source === 'provided' ? 'introd.' : 'calc.'}
      size='small'
      variant='outlined'
      sx={{ height: 16, fontSize: 9 }}
    />
  </Tooltip>
)

export default SourceChip
