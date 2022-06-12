import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import MuiBreadcrumbs from '@mui/material/Breadcrumbs'
import { Box, Button, Grid, Stack, Typography } from '@mui/material'

import MainCard from '../MainCard'

const Breadcrumbs = ({ navigation, title, buttons, ...others }: any) => {
  const location = useLocation()
  const [main, setMain] = useState<any>()
  const [item, setItem] = useState<any>()

  const getCollapse = (menu: any) => {
    if (menu.children) {
      menu.children.filter((collapse: any) => {
        if (collapse.type && collapse.type === 'collapse') {
          getCollapse(collapse)
        } else if (collapse.type && collapse.type === 'item') {
          if (location.pathname === collapse.url) {
            setMain(menu)
            setItem(collapse)
          }
        }
        return false
      })
    }
  }

  useEffect(() => {
    navigation?.items?.map((menu: any) => {
      if (menu.type && menu.type === 'group') {
        getCollapse(menu)
      }
      return false
    })
  })

  let mainContent
  let itemContent
  let breadcrumbContent = <Typography />
  let itemTitle = ''

  if (main && main.type === 'collapse') {
    mainContent = (
            <Typography component={Link} to={document.location.pathname} variant="h6" sx={{ textDecoration: 'none' }}
                        color="textSecondary">
                {main.title}
            </Typography>
    )
  }

  if (item && item.type === 'item') {
    itemTitle = item.title
    itemContent = (
            <Typography variant="subtitle1" color="textPrimary">
                {itemTitle}
            </Typography>
    )

    if (item.breadcrumbs !== false) {
      breadcrumbContent = (
                <MainCard border={false} sx={{ mb: 3, bgcolor: 'transparent' }} {...others} content={false}>
                    <Grid container direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={1}>
                        <Grid item>
                            <MuiBreadcrumbs aria-label="breadcrumb">
                                <Typography component={Link} to="/" color="textSecondary" variant="h6"
                                            sx={{ textDecoration: 'none' }}>
                                    Inicio
                                </Typography>
                                {mainContent}
                                {itemContent}
                            </MuiBreadcrumbs>
                        </Grid>
                        {title && (
                            <Grid item sx={{ mt: 2, width: '100%' }}>
                                <Stack direction='row' sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="h5">{item.title}</Typography>
                                    {false && <Box>
                                        <Button variant='outlined'>Test</Button>
                                    </Box>}
                                </Stack>
                            </Grid>
                        )}
                    </Grid>
                </MainCard>
      )
    }
  }

  return breadcrumbContent
}
export default Breadcrumbs
