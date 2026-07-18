import { ChangeEvent } from 'react'
import InputForm from 'components/forms/InputForm'

interface Props {
  tae: string
  onTaeChange: (value: string) => void
  averageBalance: string
  onAverageBalanceChange: (value: string) => void
  /** Shown while creating a new settlement, where both fields can be filled in later. */
  optional?: boolean
}

/** TAE / average balance input pair shared by the new-settlement and edit-settlement forms. */
const SettlementRateFields = ({ tae, onTaeChange, averageBalance, onAverageBalanceChange, optional = false }: Props) => {
  const suffix = optional ? ' (Opcional)' : ''

  return (
    <>
      <InputForm
        id='tae'
        label={`TAE (%)${suffix}`}
        type='number'
        value={tae}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onTaeChange(e.target.value)}
        inputProps={{ step: 'any' }}
        size={6}
        error={false}
        errorText=''
      />
      <InputForm
        id='averageBalance'
        label={`Saldo Medio (€)${suffix}`}
        type='number'
        value={averageBalance}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onAverageBalanceChange(e.target.value)}
        inputProps={{ step: 'any' }}
        size={6}
        error={false}
        errorText=''
      />
    </>
  )
}

export default SettlementRateFields
