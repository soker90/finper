import { useTheme } from '@mui/material/styles'
import { Theme } from '@emotion/react'
import { PropsWithoutRef } from 'react'

const Logo = (props: PropsWithoutRef<any>) => {
  const theme = useTheme() as Theme

  return (
        <svg
            width={118}
            height={35}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="m7.35 17.5 1.773-1.773.447-.447-1.73-1.73h-.89l-.002.002-2.312 2.312 2.22 2.209.494-.573Z"
                fill="url(#paint0_linear)"
            />
            <path
                d="M25.877 15.727 27.65 17.5l-.176.175v.001l2.39-2.312-1.812-1.812-.002-.002h-.176l-2.122 2.052.125.125Z"
                fill="url(#paint1_linear)"
            />
            <defs>
                <linearGradient
                    id="a"
                    x1={8.625}
                    y1={14.089}
                    x2={5.567}
                    y2={17.147}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor={theme.palette.primary.darker}/>
                    <stop offset={0.964} stopColor={theme.palette.primary.dark} stopOpacity={0}/>
                </linearGradient>
                <linearGradient
                    id="b"
                    x1={26.267}
                    y1={14.128}
                    x2={28.74}
                    y2={16.938}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor={theme.palette.primary.darker}/>
                    <stop offset={1} stopColor={theme.palette.primary.dark} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <text
                xmlSpace="preserve"
                style={{
                  fontStyle: 'normal',
                  fontVariant: 'normal',
                  fontWeight: 550,
                  fontStretch: 'normal',
                  fontSize: '18.6667px',
                  fontFamily: "'Public Sans'",
                  fontVariantLigatures: 'normal',
                  fontVariantCaps: 'normal',
                  fontVariantNumeric: 'normal',
                  fontVariantEastAsian: 'normal',
                  fill: theme.palette.common.black
                }}
                x={47.122}
                y={22.424}
            >
                <tspan
                    x={47.122}
                    y={22.424}
                    style={{
                      fill: '#000',
                      fillOpacity: 0.85098
                    }}
                >
                    {'finper'}
                </tspan>
            </text>
            <text
                xmlSpace="preserve"
                style={{
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '40px',
                  fontFamily: "'Public Sans'",
                  fill: theme.palette.primary.main,
                  strokeWidth: 0.553158
                }}
                x={-0.627}
                y={47.977}
                transform="scale(1.8 .53382)"
            >
                <tspan
                    x={0}
                    y={45}
                    style={{
                      strokeWidth: 0.553158
                    }}
                >
                    {'f'}
                </tspan>
            </text>
        </svg>
  )
}

export default Logo
