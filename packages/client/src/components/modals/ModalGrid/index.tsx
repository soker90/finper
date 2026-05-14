import { ReactNode, FormEvent } from 'react'
import {
  Modal,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Button,
  SxProps,
  Theme,
  Box
} from '@mui/material'

interface Props {
  show: boolean
  onClose: () => void
  title: string
  children: any
  action?: any
  actions?: any
  actionDisabled?: boolean
  cardSx?: SxProps<Theme>
}

const ModalGrid = ({
  show, title, children, action, actions, onClose, actionDisabled, cardSx
}: Props) => {
  const _renderButtons = () => (
    <>
      <Button onClick={onClose}>
        {action ? 'Cancelar' : 'Cerrar'}
      </Button>
      {action && (
        <Button color='primary' variant='contained' type='submit' disabled={actionDisabled}>
          Aceptar
        </Button>
      )}
    </>
  )

  const _renderButton = ({ value, ...rest }: any): ReactNode => (
    <Button key={`modal-action-${value}`} {...rest}>
      {value}
    </Button>
  )

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (action) {
      action(e)
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={show}
      sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box
        component='form'
        onSubmit={handleFormSubmit}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 600, md: 800 },
          maxHeight: '100%',
          display: 'flex',
          outline: 'none'
        }}
      >
        <Card sx={{
          ...cardSx,
          width: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        >
          <CardHeader title={title} />
          <Divider />
          <CardContent sx={{ overflowY: 'auto' }}>
            <Grid
              container
              spacing={3}
            >
              {children}
            </Grid>
          </CardContent>
          <Divider />
          <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
            {actions?.map(_renderButton) || _renderButtons()}
          </CardActions>
        </Card>
      </Box>
    </Modal>
  )
}

export default ModalGrid
