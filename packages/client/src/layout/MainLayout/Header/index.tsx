import { useTheme } from '@mui/material/styles'
import { AppBar, IconButton, Toolbar, useMediaQuery } from '@mui/material'

import AppBarStyled from './AppBarStyled'
import HeaderContent from './HeaderContent'

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'

type HeaderProps = {
    open: boolean,
    handleDrawerToggle: () => void,
}

const Header = ({ open, handleDrawerToggle }: HeaderProps) => {
  const theme: any = useTheme()
  const matchDownMD = useMediaQuery(theme.breakpoints.down('lg'))

  const iconBackColor = 'grey.100'
  const iconBackColorOpen = 'grey.200'

  const mainHeader = (
        <Toolbar>
            <IconButton
                disableRipple
                aria-label="open drawer"
                onClick={handleDrawerToggle}
                edge="start"
                color="secondary"
                sx={{ color: 'text.primary', bgcolor: open ? iconBackColorOpen : iconBackColor, ml: { xs: 0, lg: -2 } }}
            >
                {!open ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </IconButton>
            <HeaderContent />
        </Toolbar>
  )

  const appBar: any = {
    position: 'fixed',
    color: 'inherit',
    elevation: 0,
    sx: {
      borderBottom: `1px solid ${theme.palette.divider}`
    }
  }

  return (
        <>
            {!matchDownMD
              ? (
                    <AppBarStyled open={open} {...appBar}>
                        {mainHeader}
                    </AppBarStyled>
                )
              : (
                    <AppBar {...appBar}>{mainHeader}</AppBar>
                )}
        </>
  )
}

export default Header
