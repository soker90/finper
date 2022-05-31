import { useState } from 'react'

import {
  Button,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack
} from '@mui/material'

import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'

const AuthLogin = () => {
  const [showPassword, setShowPassword] = useState(false)
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleMouseDownPassword = (event: any) => {
    event.preventDefault()
  }

  const handleSubmit = () => {}
  const handleBlur = () => {}
  const handleChange = () => {}
  return (

        <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <InputLabel htmlFor="email-login">Email Address</InputLabel>
                        <OutlinedInput
                            id="email-login"
                            type="email"
                            value={'values.email'}
                            name="email"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            placeholder="Enter email address"
                            fullWidth
                            error={false}
                        />
                        {false && (
                            <FormHelperText error id="standard-weight-helper-text-email-login">
                                No erros
                            </FormHelperText>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <InputLabel htmlFor="password-login">Password</InputLabel>
                        <OutlinedInput
                            fullWidth
                            error={false}
                            id="-password-login"
                            type={showPassword ? 'text' : 'password'}
                            value={'values.password'}
                            name="password"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        size="large"
                                    >
                                        {showPassword ? <EyeOutlined/> : <EyeInvisibleOutlined/>}
                                    </IconButton>
                                </InputAdornment>
                            }
                            placeholder="Enter password"
                        />
                        {false && (
                            <FormHelperText error id="standard-weight-helper-text-password-login">
                                No errors
                            </FormHelperText>
                        )}
                    </Stack>
                </Grid>

                {false && (
                    <Grid item xs={12}>
                        <FormHelperText error>Erros</FormHelperText>
                    </Grid>
                )}
                <Grid item xs={12}>
                        <Button
                            disableElevation
                            disabled={false}
                            fullWidth
                            size="large"
                            type="submit"
                            variant="contained"
                            color="primary"
                        >
                            Login
                        </Button>
                </Grid>
            </Grid>
        </form>

  )
}

export default AuthLogin
