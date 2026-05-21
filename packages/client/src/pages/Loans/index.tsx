import { Box, CircularProgress, Grid, Typography, Alert } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { HeaderButtons } from 'components'
import { useAccounts } from 'hooks'
import { Loan } from 'types'

import {
  LoanCard,
  LoanFormModal
} from './components'
import { useLoans } from './hooks'

const Loans = () => {
  const { loans, isLoading, error } = useLoans()
  const { accounts } = useAccounts()
  const navigate = useNavigate()
  const [selectedForEdit, setSelectedForEdit] = useState<Partial<Loan>>()

  const handleClickNew = () => setSelectedForEdit({})
  const handleClickLoan = (loan: Loan) => navigate(`/prestamos/${loan._id}`)

  return (
    <>
      <HeaderButtons
        buttons={[{ Icon: PlusOutlined, title: 'Nuevo', onClick: handleClickNew }]}
        desktopSx={{ marginTop: -7 }}
      />
      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>Error al cargar los préstamos: {error.message}</Alert>
      )}
      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {!isLoading && loans.length === 0 && (
        <Typography
          color='textSecondary'
          sx={{
            mt: 4,
            textAlign: 'center'
          }}
        >
          No hay préstamos registrados.
        </Typography>
      )}
      <Grid
        container spacing={3} sx={{
          mt: 1
        }}
      >
        {loans.map((loan) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={loan._id}>
            <LoanCard
              loan={loan}
              linkedAccount={accounts.find(a => a._id === loan.account)}
              onClick={handleClickLoan}
            />
          </Grid>
        ))}
      </Grid>
      {Boolean(selectedForEdit) && (
        <LoanFormModal
          loan={selectedForEdit}
          onClose={() => setSelectedForEdit(undefined)}
        />
      )}
    </>
  )
}

export default Loans
