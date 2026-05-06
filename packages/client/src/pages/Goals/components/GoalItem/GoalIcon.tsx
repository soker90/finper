import {
  DollarOutlined,
  HomeOutlined,
  CarOutlined,
  LaptopOutlined,
  HeartOutlined,
  RocketOutlined,
  GiftOutlined,
  BankOutlined,
  TrophyOutlined,
  StarOutlined
} from '@ant-design/icons'
import { Box } from '@mui/material'
import type { FC } from 'react'

const iconMap: Record<string, FC<any>> = {
  DollarOutlined,
  HomeOutlined,
  CarOutlined,
  LaptopOutlined,
  HeartOutlined,
  RocketOutlined,
  GiftOutlined,
  BankOutlined,
  TrophyOutlined,
  StarOutlined
}

interface GoalIconProps {
  name: string
  color: string
  size?: number
  className?: string
}

const GoalIcon = ({ name, color, size = 32, className }: GoalIconProps) => {
  const Icon = iconMap[name]

  if (!Icon) return null

  return (
    <Box
      className={className}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <Icon style={{ fontSize: size * 0.56, color: '#fff' }} />
    </Box>
  )
}

export default GoalIcon
