import { Button, Grid, IconButton, Typography } from '@mui/material'
import { InlineCenter } from 'components/index'
import { Link } from 'react-router-dom'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { monthToNumber } from 'utils/format'
import { useMemo } from 'react'
import { getUrlMonth, isSameDate } from '../utils'

interface Props {
    month?: string
    year?: string
}

const Header = ({ month = '', year }: Props) => {
  const urlToday = useMemo(() => {
    const now = new Date()
    return `/presupuestos/${now.getFullYear()}/${now.getMonth()}`
  }, [])

  const handleCopy = () => {

  }

  return (
        <Grid container spacing={3} sx={{ alignItems: 'center', justifyContent: 'space-between', paddingBottom: 3 }}>
            <Grid item>
                <Button variant='outlined' disableElevation component={Link}
                        to={urlToday} disabled={isSameDate(year, month)}> ACTUAL</Button>
            </Grid>
            <Grid item>
                <InlineCenter>
                    <IconButton color="primary" aria-label='izquierda' size='large' component={Link}
                                to={getUrlMonth(year, parseInt(month) - 1)} disabled={!month}>
                        <LeftOutlined/>
                    </IconButton>
                    <Typography typography='h3'>{monthToNumber(month)} {year} </Typography>
                    <IconButton color="primary" aria-label='derecha' size='large' component={Link}
                                to={getUrlMonth(year, parseInt(month) + 1)} disabled={!month}>
                        <RightOutlined/>
                    </IconButton>
                </InlineCenter>
            </Grid>
            <Grid item>
                <Button variant='outlined' onClick={handleCopy}>Copiar mes anterior </Button>
            </Grid>
        </Grid>
  )
}

export default Header
