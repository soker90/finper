import { Box, useTheme } from '@mui/material'
import { Theme } from '@emotion/react'

const AuthBackground = () => {
  const theme = useTheme() as Theme
  return (
    <Box sx={{ position: 'absolute', filter: 'blur(18px)', zIndex: -1, bottom: 0 }}>
      <svg
        width='100%' viewBox='0 0 405 809' fill='none'
        xmlns='http://www.w3.org/2000/svg' style={{ height: 'calc(100vh - 175px)' }}
      >
        {/* <path
                    d="M-358.39 358.707L-293.914 294.23L-293.846 294.163H-172.545L-220.81 342.428L-233.272 354.889L-282.697 404.314L-276.575 410.453L0.316589 687.328L283.33 404.314L233.888 354.889L230.407 351.391L173.178 294.163H294.48L294.547 294.23L345.082 344.765L404.631 404.314L0.316589 808.629L-403.998 404.314L-358.39 358.707ZM0.316589 0L233.938 233.622H112.637L0.316589 121.301L-112.004 233.622H-233.305L0.316589 0Z"
                    fill={theme.palette.primary.light}
                />
                <path
                    d="M-516.39 358.707L-451.914 294.23L-451.846 294.163H-330.545L-378.81 342.428L-391.272 354.889L-440.697 404.314L-434.575 410.453L-157.683 687.328L125.33 404.314L75.8879 354.889L72.4068 351.391L15.1785 294.163H136.48L136.547 294.23L187.082 344.765L246.631 404.314L-157.683 808.629L-561.998 404.314L-516.39 358.707ZM-157.683 0L75.9383 233.622H-45.3627L-157.683 121.301L-270.004 233.622H-391.305L-157.683 0Z"
                    fill={theme.palette.success.light}
                    opacity="0.6"
                /> */}
        <path
          d='M-647.4 358.7L-582.9 294.2L-582.8 294.2H-461.5L-509.8 342.4L-522.3 354.9L-571.7 404.3L-565.6 410.5L-288.7 687.3L-5.7 404.3L-55.1 354.9L-58.6 351.4L-115.8 294.2H5.5L5.6 294.2L56.1 344.8L115.6 404.3L-288.7 808.6L-693 404.3L-647.4 358.7ZM-288.7 0L-55.1 233.6H-176.4L-288.7 121.3L-401 233.6H-522.3L-288.7 0Z'
          fill={theme.palette.error.lighter}
          opacity='1'
        />
        <rect
          x='140' y='0' width='100' height='800'
          fill={theme.palette.primary.light}
        />
      </svg>
    </Box>
  )
}

export default AuthBackground
