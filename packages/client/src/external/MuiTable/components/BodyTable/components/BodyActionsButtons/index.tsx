import { useMemo } from 'react'
import { IconButton, TableCell, Tooltip } from '@mui/material'

import { tooltipStyle, actionIcon } from './styles'
import { Action, DisabledButton } from '../../../../types'

interface BodyActionsButtonsProps {
    row: any;
    index: number;
    actions: Action[]
}

const BodyActionsButtons = ({ row, index, actions }: BodyActionsButtonsProps) => {
  const actionsFiltered = useMemo(
    () => actions.filter(({ isFreeAction }) => !isFreeAction),
    [actions]
  )

  const _isDisabled = (disabled: DisabledButton): boolean => (
    typeof disabled === 'function'
      ? disabled(row)
      : Boolean(disabled)
  )

  return (
        <TableCell align='right'>
            {actionsFiltered
              .map(({
                icon: Icon, tooltip, onClick, to, disabled, ...restButton
              }) => (
                    <Tooltip
                        key={tooltip}
                        title={tooltip}
                        sx={tooltipStyle}
                    >
                        <IconButton
                            {...(onClick && { onClick: () => onClick(row, index) })}
                            {...(to && { to: to(row, index) })}
                            {...restButton}
                            size='large'
                            disabled={_isDisabled(disabled)}
                        >
                            <Icon className={actionIcon}/>
                        </IconButton>
                    </Tooltip>
              ))}
        </TableCell>
  )
}

export default BodyActionsButtons
