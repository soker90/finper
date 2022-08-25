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
import { useState } from 'react'

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
                <Button onClick={action} color='primary' variant='contained'>
                    Aceptar
                </Button>
            )}
        </>
  )

  const _renderButton = ({ value, ...rest }: any, index: number): Button => (
        <Button key={index} {...rest}>
            {value}
        </Button>
  )

  return (
        <Modal
            onClose={close || onClose}
            open={show}
        >
            <Card>
                <form>
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
                </form>
            </Card>
        </Modal>
  )
}

export default ModalGrid
