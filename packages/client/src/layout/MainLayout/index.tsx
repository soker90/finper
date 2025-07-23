import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { useTheme } from '@mui/material/styles'
import { Box, Toolbar, useMediaQuery } from '@mui/material'

import Drawer from './Drawer'
import Header from './Header'
import navigation from './menu-items'
import { Breadcrumbs } from 'components'
import AuthGuard from 'guards/AuthGuard'

import styles from './styles.module.css'

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
            <Box className={styles.container}>
                <Header open={open} handleDrawerToggle={handleDrawerToggle} />
                <Drawer open={open} handleDrawerToggle={handleDrawerToggle} />
                <Box component="main" sx={{ p: { xs: 2, sm: 3 } }}>
                    <Toolbar />
                    <Breadcrumbs navigation={navigation} title divider={false} />
                    <Outlet />
                </Box>
            </Box>
        </AuthGuard>
  )
}
export default MainLayout
