import { useNavigate } from 'react-router'
import { Grid, Grow } from '@mui/material'
import { LoanCard } from '../../Loans/components'
import { useLoans } from '../../Loans/hooks'
import { Loan } from 'types'
import SectionTitle from './SectionTitle'

const LoansSection = () => {
  const navigate = useNavigate()
  const { loans } = useLoans()

  const activeLoans = loans.filter(loan => loan.pendingAmount > 0)

  if (!activeLoans.length) return null

  const handleClick = (loan: Loan) => {
    navigate(`/prestamos/${loan._id}`)
  }

  return (
    <>
      <SectionTitle>Préstamos</SectionTitle>
      {activeLoans.map((loan, i) => (
        <Grid key={loan._id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Grow in timeout={400 + i * 150}>
            <div>
              <LoanCard loan={loan} onClick={handleClick} />
            </div>
          </Grow>
        </Grid>
      ))}
    </>
  )
}

export default LoansSection
