import { Box, List, Typography } from '@mui/material'

import NavItem from './NavItem'

const NavGroup = ({ item }: any) => {
  const navCollapse = item.children?.map((menuItem: any) =>
        <NavItem key={menuItem.id} item={menuItem} />)
  return (
        <List
            subheader={
                item.title &&
                    <Box sx={{ pl: 3, mb: 1.5 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            {item.title}
                        </Typography>
                    </Box>
            }
            sx={{ mb: 1.5, py: 0, zIndex: 0 }}
        >
            {navCollapse}
        </List>
  )
}

export default NavGroup
