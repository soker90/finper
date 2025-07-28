import { Button, Grid, IconButton, Typography } from '@mui/material'
import { Link } from 'react-router'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

import { InlineCenter } from 'components/index'
import { getUrlYear, isSameDate } from '../utils'

interface Props {
  year: string
}

const Header = ({ year }: Props) => {
  return (
    <Grid container spacing={3} sx={{ alignItems: 'center', justifyContent: 'space-between', paddingBottom: 3 }}>
      <Grid>
        <Button
          variant='outlined' disableElevation component={Link}
          to={getUrlYear()} disabled={isSameDate(year)}
        > ACTUAL
        </Button>
      </Grid>
      <Grid sx={{ marginRight: { md: 30 } }}>
        <InlineCenter>
          <IconButton
            color='primary' aria-label='izquierda' size='large' component={Link}
            to={getUrlYear(+year - 1)} disabled={!year}
          >
            <LeftOutlined />
          </IconButton>
          <Typography typography='h3'>{year} </Typography>
          <IconButton
            color='primary' aria-label='derecha' size='large' component={Link}
            to={getUrlYear(+year + 1)} disabled={!year} data-testid='right-arrow'
          >
            <RightOutlined />
          </IconButton>
        </InlineCenter>
      </Grid>
      <Grid />
    </Grid>
  )
}
export default Header
