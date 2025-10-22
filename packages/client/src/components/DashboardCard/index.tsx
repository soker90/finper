import React from 'react'
import styles from './DashboardCard.module.css'

interface DashboardCardProps {
  title: string
  value?: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  children?: React.ReactNode
  className?: string
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  children,
  className = ''
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(val)
    }
    return val
  }

  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <h3 className={styles.title}>{title}</h3>
        </div>
        {trend && (
          <div className={`${styles.trend} ${trend.isPositive ? styles.positive : styles.negative}`}>
            <span className={styles.trendIcon}>
              {trend.isPositive ? '↗' : '↘'}
            </span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {value !== undefined && (
        <div className={styles.value}>
          {formatValue(value)}
        </div>
      )}

      {subtitle && (
        <div className={styles.subtitle}>
          {subtitle}
        </div>
      )}

      {children && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  )
}

export default DashboardCard
