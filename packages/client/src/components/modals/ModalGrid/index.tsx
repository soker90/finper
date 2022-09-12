import { ReactNode } from 'react'
import {
  Modal,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Button
} from '@mui/material'

interface Props {
    show: boolean
    onClose: () => void
    title: string
    children: any
    action?: any
    actions?: any
}

const ModalGrid = ({
  show, title, children, action, actions, onClose
}: Props) => {
  const _renderButtons = () => (
        <>
            <Button onClick={onClose}>
                {action ? 'Cancelar' : 'Cerrar'}
            </Button>
            {action && (
                <Button color='primary' variant='contained' type='submit'>
                    Aceptar
                </Button>
            )}
        </>
  )

  const _renderButton = ({ value, ...rest }: any, index: number): ReactNode => (
        <Button key={index} {...rest}>
            {value}
        </Button>
  )

  return (
        <Modal
            onClose={onClose}
            open={show}
        >
            <form onSubmit={action}>
                <Card>
                    <CardHeader title={title}/>
                    <Divider/>
                    <CardContent>
                        <Grid
                            container
                            spacing={3}
                        >
                            {children}
                        </Grid>
                    </CardContent>
                    <Divider/>
                    <CardActions>
                        {actions?.map(_renderButton) || _renderButtons()}
                    </CardActions>
                </Card>
            </form>
        </Modal>
  )
}

export default ModalGrid
