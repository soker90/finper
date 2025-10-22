import React from 'react'
import styles from './SimpleChart.module.css'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface SimpleChartProps {
  data: ChartDataPoint[]
  type: 'bar' | 'doughnut'
  height?: number
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, type, height = 200 }) => {
  const maxValue = Math.max(...data.map(item => item.value))
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]

  if (type === 'bar') {
    return (
      <div className={styles.barChart} style={{ height }}>
        <div className={styles.barContainer}>
          {data.map((item, index) => (
            <div key={item.label} className={styles.barWrapper}>
              <div
                className={styles.bar}
                style={{
                  height: `${(item.value / maxValue) * 80}%`,
                  backgroundColor: item.color || colors[index % colors.length]
                }}
              />
              <span className={styles.barLabel}>{item.label}</span>
              <span className={styles.barValue}>
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0
                }).format(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'doughnut') {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0

    return (
      <div className={styles.doughnutChart} style={{ height }}>
        <div className={styles.chartContainer}>
          <svg viewBox='0 0 100 100' className={styles.svg}>
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const angle = (percentage / 100) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle

              currentAngle += angle

              const x1 = 50 + 35 * Math.cos((startAngle - 90) * Math.PI / 180)
              const y1 = 50 + 35 * Math.sin((startAngle - 90) * Math.PI / 180)
              const x2 = 50 + 35 * Math.cos((endAngle - 90) * Math.PI / 180)
              const y2 = 50 + 35 * Math.sin((endAngle - 90) * Math.PI / 180)

              const largeArcFlag = angle > 180 ? 1 : 0

              const pathData = [
                'M 50 50',
                `L ${x1} ${y1}`,
                `A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')

              return (
                <path
                  key={item.label}
                  d={pathData}
                  fill={item.color || colors[index % colors.length]}
                  stroke='white'
                  strokeWidth='0.5'
                />
              )
            })}
          </svg>
          <div className={styles.centerText}>
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalValue}>
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0
              }).format(total)}
            </div>
          </div>
        </div>
        <div className={styles.legend}>
          {data.map((item, index) => (
            <div key={item.label} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: item.color || colors[index % colors.length] }}
              />
              <span className={styles.legendLabel}>{item.label}</span>
              <span className={styles.legendValue}>
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

export default SimpleChart
