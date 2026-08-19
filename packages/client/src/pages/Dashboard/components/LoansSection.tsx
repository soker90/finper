import { useNavigate } from 'react-router'
import { Grid, Grow } from '@mui/material'
import { LoanCard } from '../../Loans/components'
import { useLoans } from '../../Loans/hooks'
import { useCreditCards } from '../../CreditCards/hooks/useCreditCards'
import { Loan, CreditCard } from 'types'
import { getId } from 'utils'
import SectionTitle from './SectionTitle'
import CreditCardMiniCard from './CreditCardMiniCard'

const LoansSection = () => {
  const navigate = useNavigate()
  const { loans } = useLoans()
  const { creditCards } = useCreditCards()

  const activeLoans = loans.filter(loan => loan.pendingAmount > 0)
  const activeCreditCards = creditCards.filter(card => (card.currentDebt ?? 0) > 0)

  if (!activeLoans.length && !activeCreditCards.length) return null

  const handleNavigateToLoan = (loan: Loan) => {
    navigate(`/prestamos/${loan._id}`)
  }

  const handleNavigateToCard = (card: CreditCard) => {
    const id = getId(card)
    if (id) navigate(`/tarjetas/${id}`)
  }

  return (
    <>
      <SectionTitle>Préstamos y Tarjetas</SectionTitle>
      {activeLoans.map((loan, i) => (
        <Grid key={loan._id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Grow in timeout={400 + i * 150}>
            <div>
              <LoanCard loan={loan} onClick={handleNavigateToLoan} />
            </div>
          </Grow>
        </Grid>
      ))}
      {activeCreditCards.map((card, i) => (
        <Grid key={getId(card)} size={{ xs: 12, sm: 6, md: 4 }}>
          <Grow in timeout={400 + (activeLoans.length + i) * 150}>
            <div>
              <CreditCardMiniCard card={card} onClick={handleNavigateToCard} />
            </div>
          </Grow>
        </Grid>
      ))}
    </>
  )
}

export default LoansSection
