import { FC } from 'react'
import { Button, Stack, useMediaQuery, useTheme } from '@mui/material'

interface ButtonProps {
    Icon: FC,
    title: string
    onClick: () => void
    disabled?: boolean
}

const HeaderButtons = ({ buttons, desktopSx }: { buttons: ButtonProps[], desktopSx: {} }) => {
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  return (
        <Stack spacing={1} direction={isMobile ? 'column' : 'row'}
               sx={[!isMobile && desktopSx, { display: 'flex', justifyContent: 'end' }]}>
            {buttons.map(({ Icon, title, onClick, disabled }: ButtonProps) => (
                <Button
                    key={title}
                    variant="outlined"
                    color="primary"
                    fullWidth={isMobile}
                    startIcon={<Icon />}
                    onClick={onClick}
                    disabled={disabled}
                >
                    {title}
                </Button>
            ))}
        </Stack>
  )
}
export default HeaderButtons
