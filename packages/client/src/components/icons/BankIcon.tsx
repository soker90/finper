import { FC, Fragment, lazy, useMemo } from 'react'

const openbank = lazy(() => import('./OpenBankIcon'))
const unicaja = lazy(() => import('./UnicajaIcon'))
const efectivo = lazy(() => import('./MoneyIcon'))
const n26 = lazy(() => import('./N26Icon'))
const imagin = lazy(() => import('./ImaginIcon'))

type BankIconsProps = {
    name: string
    className?: string
}

const Icons: Record<string, FC<any>> = {
  openbank,
  unicaja,
  efectivo,
  n26,
  imagin
}

const BankIcon: FC<BankIconsProps> = ({ name, ...props }) => {
  const Icon = useMemo(() => Icons[name?.toLowerCase()] || Fragment, [name])
  if (!name) return null
  return <Icon {...props} />
}

export default BankIcon
