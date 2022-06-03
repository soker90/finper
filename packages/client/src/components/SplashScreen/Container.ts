import { styled } from '@mui/material'

export const Container = styled('div')(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  justifyContent: 'center',
  left: 0,
  padding: theme.spacing(3),
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 2000
}))
