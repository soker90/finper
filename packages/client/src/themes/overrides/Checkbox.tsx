import { Box } from '@mui/material'
import { CheckSquareFilled, MinusSquareFilled } from '@ant-design/icons'
import { Theme } from '@emotion/react'
import getColors from 'utils/getColors'

function getColorStyle ({ color, theme }: { color: string, theme: Theme }) {
  const colors = getColors(theme, color)
  const { lighter, main, dark } = colors

  return {
    '&:hover': {
      backgroundColor: lighter,
      '& .icon': {
        borderColor: main
      }
    },
    '&.Mui-focusVisible': {
      outline: `2px solid ${dark}`,
      outlineOffset: -4
    }
  }
}

function getSizeStyle (size: string) {
  switch (size) {
    case 'small':
      return { size: 16, fontSize: 1, position: 1 }
    case 'large':
      return { size: 24, fontSize: 1.6, position: 2 }
    case 'medium':
    default:
      return { size: 20, fontSize: 1.35, position: 2 }
  }
}

function checkboxStyle (size: string) {
  const sizes = getSizeStyle(size)

  return {
    '& .icon': {
      width: sizes.size,
      height: sizes.size,
      '& .filled': {
        fontSize: `${sizes.fontSize}rem`,
        top: -sizes.position,
        left: -sizes.position
      }
    }
  }
}

export default function Checkbox (theme: Theme) {
  const { palette } = theme

  return {
    MuiCheckbox: {
      defaultProps: {
        className: 'size-small',
        icon: <Box className="icon" sx={{
          width: 16,
          height: 16,
          border: '1px solid',
          borderColor: 'inherit',
          borderRadius: 0.25
        }}/>,
        checkedIcon: (
                    <Box
                        className="icon"
                        sx={{
                          width: 16,
                          height: 16,
                          border: '1px solid',
                          borderColor: 'inherit',
                          borderRadius: 0.25,
                          position: 'relative'
                        }}
                    >
                        <CheckSquareFilled className="filled" style={{ position: 'absolute' }}/>
                    </Box>
        ),
        indeterminateIcon: (
                    <Box
                        className="icon"
                        sx={{
                          width: 16,
                          height: 16,
                          border: '1px solid',
                          borderColor: 'inherit',
                          borderRadius: 0.25,
                          position: 'relative'
                        }}
                    >
                        <MinusSquareFilled className="filled" style={{ position: 'absolute' }}/>
                    </Box>
        )
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          color: (palette.secondary as any)[300],
          '&.size-small': {
            ...checkboxStyle('small')
          },
          '&.size-medium': {
            ...checkboxStyle('medium')
          },
          '&.size-large': {
            ...checkboxStyle('large')
          }
        },
        colorPrimary: getColorStyle({ color: 'primary', theme }),
        colorSecondary: getColorStyle({ color: 'secondary', theme }),
        colorSuccess: getColorStyle({ color: 'success', theme }),
        colorWarning: getColorStyle({ color: 'warning', theme }),
        colorInfo: getColorStyle({ color: 'info', theme }),
        colorError: getColorStyle({ color: 'error', theme })
      }
    }
  }
}