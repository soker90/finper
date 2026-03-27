import { Box, CircularProgress, Grid, Typography } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { HeaderButtons } from 'components'
import { Loan } from 'types'

import {
  LoanCard,
  LoanFormModal,
  LoanRemoveModal
} from './components'
import { useLoans } from './hooks'

const Loans = () => {
  const { loans, isLoading } = useLoans()
  const navigate = useNavigate()
  const [selectedForEdit, setSelectedForEdit] = useState<Partial<Loan>>()
  const [selectedForRemove, setSelectedForRemove] = useState<Loan>()

  const handleClickNew = () => setSelectedForEdit({})
  const handleClickLoan = (loan: Loan) => navigate(`/prestamos/${loan._id}`)

  return (
    <>
      <HeaderButtons
        buttons={[{ Icon: PlusOutlined, title: 'Nuevo', onClick: handleClickNew }]}
        desktopSx={{ marginTop: -7 }}
      />
      {isLoading && (
        <Box display='flex' justifyContent='center' mt={4}>
          <CircularProgress />
        </Box>
      )}
      {!isLoading && loans.length === 0 && (
        <Typography color='textSecondary' mt={4} textAlign='center'>
          No hay préstamos registrados.
        </Typography>
      )}
      <Grid container spacing={3} mt={1}>
        {loans.map((loan) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={loan._id}>
            <LoanCard loan={loan} onClick={handleClickLoan} />
          </Grid>
        ))}
      </Grid>

      {Boolean(selectedForEdit) && (
        <LoanFormModal
          loan={selectedForEdit}
          onClose={() => setSelectedForEdit(undefined)}
        />
      )}
      {!!selectedForRemove && (
        <LoanRemoveModal
          loan={selectedForRemove}
          onClose={() => setSelectedForRemove(undefined)}
        />
      )}
    </>
  )
}

export default Loans
