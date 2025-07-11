import { FC, Fragment, lazy, useMemo } from 'react'
import gourmet from 'assets/img/banks/up_spain.png'

const amazon = lazy(() => import('./AmazonIcon'))
const openbank = lazy(() => import('./OpenBankIcon'))
const unicaja = lazy(() => import('./UnicajaIcon'))
const efectivo = lazy(() => import('./MoneyIcon'))
const n26 = lazy(() => import('./N26Icon'))
const imagin = lazy(() => import('./ImaginIcon'))
const waylet = lazy(() => import('./WayletIcon'))
const revolut = lazy(() => import('./RevolutIcon'))
const bankinter = lazy(() => import('./BankinterIcon'))

type BankIconsProps = {
    name: string
    className?: string
    width?: number
    height?: number
}

const Icons: Record<string, FC<any>> = {
  openbank,
  unicaja,
  efectivo,
  n26,
  imagin,
  amazon,
  waylet,
  gourmet: (props) => <img src={gourmet} alt='goutmet' {...props} />,
  revolut,
  bankinter
}

const BankIcon: FC<BankIconsProps> = ({ name, ...props }) => {
  const Icon = useMemo(() => Icons[name?.toLowerCase()] || Fragment, [name])
  if (!name) return null
  return <Icon {...props} />
}

export default BankIcon
