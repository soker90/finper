import { ComponentType, ReactNode } from 'react'
import { IconButtonProps } from '@mui/material'

export interface Column<T> {
  id: string
  label: string
  /** Direct property access — ignored if `render` is provided */
  field?: keyof T
  /** Custom cell renderer — takes priority over `field` */
  render?: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  width?: number | string
}

export interface Action<T> {
  icon: ComponentType<{ className?: string }>
  tooltip: string
  onClick?: (row: T) => void
  /** react-router navigation target */
  to?: (row: T) => string
  disabled?: boolean | ((row: T) => boolean)
  color?: IconButtonProps['color']
}
