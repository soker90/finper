import { useTheme } from '@mui/material/styles'
import { Card, CardContent, CardHeader, Divider, Typography } from '@mui/material'

import Highlighter from '../Highlighter'
import { Theme } from '@emotion/react'

const headerSX = {
  p: 2.5,
  '& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' }
}

const MainCard = (
  {
    border = true,
    boxShadow,
    children,
    content = true,
    contentSX = {},
    darkTitle,
    divider = true,
    elevation,
    secondary,
    shadow,
    sx = {},
    title,
    codeHighlight,
    ...others
  }: any): any => {
  const theme = useTheme<Theme>()
  boxShadow = theme.palette.mode === 'dark' ? boxShadow || true : boxShadow

  return (
        <Card
            elevation={elevation || 0}
            {...others}
            sx={[theme => ({
              ...sx,
              borderRadius: 2,
              // @ts-ignore
              borderColor: theme.palette.grey.A800,
              // @ts-ignore
              boxShadow: boxShadow && (!border || theme.palette.mode === 'dark') ? shadow || theme.customShadows.z1 : 'inherit',
              '& pre': {
                m: 0,
                p: '16px !important',
                fontFamily: theme.typography.fontFamily,
                fontSize: '0.75rem'
              },
              ...theme.applyStyles('dark', {
                borderColor: theme.palette.divider
              })
            }), border
              ? {
                  border: '1px solid'
                }
              : {
                  border: 'none'
                }, boxShadow
              ? {
                  ':hover': {
                    boxShadow: shadow || theme.customShadows.z1
                  }
                }
              : {
                  ':hover': {
                    boxShadow: 'inherit'
                  }
                }]}
        >
            {!darkTitle && title && (
                <CardHeader sx={headerSX} titleTypographyProps={{ variant: 'subtitle1' }} title={title}
                            action={secondary} />
            )}
            {darkTitle && title && (
                <CardHeader sx={headerSX} title={<Typography variant="h3">{title}</Typography>} action={secondary} />
            )}
            {title && divider && <Divider />}
            {/* card content */}
            {content && <CardContent sx={contentSX}>{children}</CardContent>}
            {!content && children}
            {codeHighlight && (
                <>
                    <Divider sx={{ borderStyle: 'dashed' }} />
                    <Highlighter />
                </>
            )}
        </Card>
  )
}

export default MainCard
