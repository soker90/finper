import { FC, Fragment, lazy, useMemo } from 'react'

const openbank = lazy(() => import('./OpenBankIcon'))
const unicaja = lazy(() => import('./UnicajaIcon'))

type BankIconsProps = {
    name: string
    className?: string
}

const Icons: Record<string, FC<any>> = {
  openbank,
  unicaja
}

const BankIcon: FC<BankIconsProps> = ({ name, ...props }) => {
  const Icon = useMemo(() => Icons[name] || Fragment, [name])
  if (!name) return null
  return <Icon {...props} />
}

export default BankIcon
