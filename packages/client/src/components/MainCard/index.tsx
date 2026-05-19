import { useTheme } from '@mui/material/styles'
import { Card, CardContent, CardHeader, Divider, Typography } from '@mui/material'

import Highlighter from '../Highlighter'
import { Theme } from '@emotion/react'

const headerSX = {
  p: 2.5,
  '& .MuiCardHeader-action': { m: '0px auto', alignSelf: 'center' }
}

const EMPTY_SX = {}

const MainCard = (
  {
    border = false,
    boxShadow: boxShadowProp,
    children,
    content = true,
    contentSX = EMPTY_SX,
    darkTitle,
    divider = true,
    elevation,
    secondary,
    shadow,
    sx = EMPTY_SX,
    title,
    codeHighlight,
    ...others
  }: any): any => {
  const theme = useTheme<Theme>()
  const resolvedBoxShadow = theme.palette.mode === 'dark' ? (boxShadowProp ?? true) : boxShadowProp

  return (
    <Card
      elevation={elevation || 0}
      {...others}
      sx={[theme => ({
        borderRadius: 2,
        // @ts-ignore – customShadows from extended Theme
        boxShadow: shadow || theme.customShadows?.z1 || '0px 2px 8px rgba(0,0,0,0.15)',
        transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
        '& pre': {
          m: 0,
          p: '16px !important',
          fontFamily: theme.typography.fontFamily,
          fontSize: '0.75rem'
        },
        ...theme.applyStyles('dark', {
          borderColor: theme.palette.divider
        }),
        ...sx
      }), border
        ? {
            border: '1px solid',
            // @ts-ignore
            borderColor: theme.palette.grey.A800
          }
        : {
            border: 'none'
          }, resolvedBoxShadow
        ? {
            ':hover': {
              // @ts-ignore – customShadows from extended Theme
              boxShadow: shadow || theme.customShadows?.z1 || '0px 2px 8px rgba(0,0,0,0.15)'
            }
          }
        : {}]}
    >
      {!darkTitle && title && (
        <CardHeader
          sx={headerSX} titleTypographyProps={{ variant: 'subtitle1' }} title={title}
          action={secondary}
        />
      )}
      {darkTitle && title && (
        <CardHeader sx={headerSX} title={<Typography variant='h3'>{title}</Typography>} action={secondary} />
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
