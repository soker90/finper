import { Link, useLocation } from 'react-router-dom'
import { Avatar, Chip, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme } from '@mui/material'

const NavItem = ({ item, level }: any) => {
  const location = useLocation()
  const theme = useTheme()

  const Icon = item.icon
  const itemIcon = item.icon ? <Icon style={{ fontSize: '1rem' }} /> : false

  const isSelected = location.pathname.includes(item.url)

  const textColor = 'text.primary'
  const iconSelectedColor = 'primary.main'

  return (
        <ListItemButton
            component={Link}
            to={item.url}
            disabled={item.disabled}
            selected={isSelected}
            sx={{
              zIndex: 1201,
              pl: `${level * 28}px`,
              py: 1,
              '&:hover': {
                bgcolor: 'primary.lighter'
              },
              '&.Mui-selected': {
                bgcolor: 'primary.lighter',
                borderRight: `2px solid ${theme.palette.primary.main}`,
                color: iconSelectedColor,
                '&:hover': {
                  color: iconSelectedColor,
                  bgcolor: 'primary.lighter'
                }
              }
            }}
        >
            {itemIcon && (
                <ListItemIcon
                    sx={{
                      minWidth: 28,
                      color: isSelected ? iconSelectedColor : textColor

                    }}
                >
                    {itemIcon}
                </ListItemIcon>
            )}

            <ListItemText
                primary={
                    <Typography variant="h6" sx={{ color: isSelected ? iconSelectedColor : textColor }}>
                        {item.title}
                    </Typography>
                }
            />

            {item.chip && (
                <Chip
                    color={item.chip.color}
                    variant={item.chip.variant}
                    size={item.chip.size}
                    label={item.chip.label}
                    avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
                />
            )}
        </ListItemButton>
  )
}

export default NavItem
