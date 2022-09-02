import { useMemo, useState } from 'react'
import { Button, Grid, IconButton, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

import { InlineCenter } from 'components/index'
import { monthToNumber } from 'utils/format'
import { getUrlMonth, isSameDate } from '../utils'
import { copyBudgets } from 'services/apiService'
import { mutate } from 'swr'
import { getPreviousMonthYear } from 'utils'

interface Props {
    month?: string
    year?: string
}

const Header = ({ month = '', year }: Props) => {
  const [copyInProgress, setCopyInProgress] = useState(false)
  const urlToday = useMemo(() => {
    const now = new Date()
    return `/presupuestos/${now.getFullYear()}/${now.getMonth()}`
  }, [])

  const handleCopy = async () => {
    setCopyInProgress(true)
    const lastMonth = getPreviousMonthYear(month, year as string)
    const { error } = await copyBudgets({ month, year: year as string, monthOrigin: lastMonth.month, yearOrigin: lastMonth.year })
    if (!error) {
      await mutate(getUrlMonth(year, parseInt(month)))
    }
    setCopyInProgress(false)
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
                <Button variant='outlined' onClick={handleCopy} disabled={copyInProgress}>Copiar mes anterior </Button>
            </Grid>
        </Grid>
  )
}

export default Header
