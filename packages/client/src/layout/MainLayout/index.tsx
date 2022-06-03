import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { useTheme } from '@mui/material/styles'
import { Box, Toolbar, useMediaQuery } from '@mui/material'

import Drawer from './Drawer'
import Header from './Header'
import navigation from './menu-items'
import Breadcrumbs from 'components/Breadcrumbs'
import AuthGuard from '../../guards/AuthGuard'

const MainLayout = () => {
  const theme = useTheme()
  const matchDownLG = useMediaQuery(theme.breakpoints.down('xl'))

  const [open, setOpen] = useState(false)
  const handleDrawerToggle = () => {
    setOpen(state => !state)
  }

  useEffect(() => {
    setOpen(!matchDownLG)
  }, [matchDownLG])

  return (
        <AuthGuard>
            <Box sx={{ display: 'flex', width: '100%' }}>
                <Header open={open} handleDrawerToggle={handleDrawerToggle}/>
                <Drawer open={open} handleDrawerToggle={handleDrawerToggle}/>
                <Box component="main" sx={{ width: '100%', flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                    <Toolbar/>
                    <Breadcrumbs navigation={navigation} title titleBottom card={false} divider={false}/>
                    <Outlet/>
                </Box>
            </Box>
        </AuthGuard>
  )
}

export default MainLayout
