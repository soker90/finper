import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  FormHelperText
} from '@mui/material'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { mutate } from 'swr'
import { Goal } from 'types'
import { fundGoal, withdrawGoal } from 'services/apiService'
import { GOALS } from 'constants/api-paths'
import { format } from 'utils'

interface GoalFundDialogProps {
  goal: Goal
  open: boolean
  onClose: () => void
  onOpen: () => void
}

const GoalFundDialog = ({ goal, open, onClose, onOpen }: GoalFundDialogProps) => {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'fund' | 'withdraw'>('fund')
  const [error, setError] = useState<string | undefined>(undefined)

  const handleSubmit = async () => {
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Introduce una cantidad válida')
      return
    }

    const { error: apiError } = mode === 'fund'
      ? await fundGoal(goal._id as string, numAmount)
      : await withdrawGoal(goal._id as string, numAmount)

    if (!apiError) {
      mutate(GOALS)
      setAmount('')
      setError(undefined)
      onClose()
    } else {
      setError(apiError)
    }
  }

  return (
    <>
      <Button
        variant='outlined'
        color='primary'
        startIcon={<PlusOutlined />}
        onClick={onOpen}
        size='small'
      >
        Añadir / Retirar fondos
      </Button>
      <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
        <DialogTitle>
          {goal.name} — {format.euro(goal.currentAmount)} / {format.euro(goal.targetAmount)}
        </DialogTitle>
        <DialogContent>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          >
            <ToggleButton value='fund'>
              <PlusOutlined style={{ marginRight: 8 }} />
              Añadir
            </ToggleButton>
            <ToggleButton value='withdraw'>
              <MinusOutlined style={{ marginRight: 8 }} />
              Retirar
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            autoFocus
            label='Cantidad'
            type='number'
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ step: 'any', min: 0.01 }}
          />
          {error && (
            <FormHelperText error sx={{ mt: 1 }}>{error}</FormHelperText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant='contained' color='primary'>
            {mode === 'fund' ? 'Añadir' : 'Retirar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default GoalFundDialog
