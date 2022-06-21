import { styled } from '@mui/material'

const ItemContent = styled('ul')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 15,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)'
  }
})

export default ItemContent
