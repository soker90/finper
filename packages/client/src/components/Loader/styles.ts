import { css, Theme } from '@emotion/react'

export const content = (theme: Theme) => css`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2001;
  width: 100%;
  background-color: #008800;
  height: 20px;
'& > * + *' {
  margin-top: ${theme.spacing(2)}
}
`
