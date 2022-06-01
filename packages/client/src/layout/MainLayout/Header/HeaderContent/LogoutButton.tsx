import { useRef } from 'react'

import {
  Box,
  ButtonBase,
  Stack,
  Typography
} from '@mui/material'

import { LogoutOutlined } from '@ant-design/icons'

const Profile = () => {
  const anchorRef = useRef<any>(null)

  const handleClose = () => {
    localStorage.removeItem('token')
    // Todo redirect to login page
  }

  return (
        <Box sx={{ flexShrink: 0, ml: 0.75 }}>
            <ButtonBase
                sx={{
                  p: 0.25,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'secondary.lighter' }
                }}
                aria-label="open profile"
                ref={anchorRef}
                aria-haspopup="true"
                onClick={handleClose}
            >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 0.5 }}>
                    <Typography variant="subtitle1">Salir</Typography>
                    <LogoutOutlined />
                </Stack>
            </ButtonBase>

        </Box>
  )
}

export default Profile
