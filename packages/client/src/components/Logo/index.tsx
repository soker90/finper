import { Link, To } from 'react-router'
import { ButtonBase, SxProps } from '@mui/material'

import Logo from './Logo'
import config from '../../config'

const LogoSection = ({ sx, to } : { sx?: SxProps, to?: To }) => (
  <ButtonBase disableRipple component={Link} to={!to ? config.defaultPath : to} sx={sx}>
    <Logo />
  </ButtonBase>
)

export default LogoSection
