import React from 'react'
import { useDashboardStats } from 'hooks'
import { TransactionType } from 'types'
import DashboardCard from 'components/DashboardCard'
import SimpleChart from 'components/SimpleChart'
import styles from './Dashboard.module.css'

const Dashboard: React.FC = () => {
  const { stats, loading, error } = useDashboardStats()

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando dashboard...</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={styles.error}>
        <h2>Error al cargar el dashboard</h2>
        <p>Ha ocurrido un error al cargar los datos financieros.</p>
      </div>
    )
  }

  const {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    netWorth,
    totalDebts,
    savingsRate,
    accountsBalance,
    topExpenseCategories,
    recentTransactions,
    monthlyTrend
  } = stats

  // Calcular tendencias
  const incomeTrend = monthlyTrend.income.previous > 0
    ? ((monthlyTrend.income.current - monthlyTrend.income.previous) / monthlyTrend.income.previous) * 100
    : 0

  const expensesTrend = monthlyTrend.expenses.previous > 0
    ? ((monthlyTrend.expenses.current - monthlyTrend.expenses.previous) / monthlyTrend.expenses.previous) * 100
    : 0

  // Preparar datos para gráficos
  const accountsChartData = accountsBalance.slice(0, 5).map((account, index) => ({
    label: account.name,
    value: account.balance,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index]
  }))

  const expensesChartData = topExpenseCategories.map((category, index) => ({
    label: category.name,
    value: category.amount,
    color: ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][index]
  }))

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>Dashboard Financiero</h1>
        <p>Resumen de tu situación financiera actual</p>
      </header>

      {/* Tarjetas principales */}
      <section className={styles.mainCards}>
        <DashboardCard
          title='Balance Total'
          value={totalBalance}
          subtitle='Suma de todas las cuentas'
          icon='💰'
        />

        <DashboardCard
          title='Patrimonio Neto'
          value={netWorth}
          subtitle='Balance total - deudas'
          icon='📈'
        />

        <DashboardCard
          title='Ingresos del Mes'
          value={monthlyIncome}
          subtitle='Mes actual'
          icon='💸'
          trend={{
            value: Math.abs(incomeTrend),
            isPositive: incomeTrend >= 0
          }}
        />

        <DashboardCard
          title='Gastos del Mes'
          value={monthlyExpenses}
          subtitle='Mes actual'
          icon='💳'
          trend={{
            value: Math.abs(expensesTrend),
            isPositive: expensesTrend < 0
          }}
        />
      </section>

      {/* Métricas adicionales */}
      <section className={styles.secondaryCards}>
        <DashboardCard
          title='Tasa de Ahorro'
          value={`${savingsRate}%`}
          subtitle='Porcentaje de ingresos ahorrado'
          icon='🎯'
        />

        <DashboardCard
          title='Deudas Totales'
          value={totalDebts}
          subtitle='Total pendiente de pago'
          icon='⚠️'
        />
      </section>

      {/* Gráficos y análisis */}
      <section className={styles.chartsSection}>
        <DashboardCard
          title='Distribución por Cuentas'
          icon='🏦'
          className={styles.chartCard}
        >
          {accountsChartData.length > 0
            ? (
              <SimpleChart
                data={accountsChartData}
                type='doughnut'
                height={300}
              />
              )
            : (
              <p className={styles.noData}>No hay datos de cuentas disponibles</p>
              )}
        </DashboardCard>

        <DashboardCard
          title='Top Gastos por Categoría'
          subtitle='Este mes'
          icon='📊'
          className={styles.chartCard}
        >
          {expensesChartData.length > 0
            ? (
              <SimpleChart
                data={expensesChartData}
                type='bar'
                height={300}
              />
              )
            : (
              <p className={styles.noData}>No hay gastos registrados este mes</p>
              )}
        </DashboardCard>
      </section>

      {/* Transacciones recientes */}
      <section className={styles.transactionsSection}>
        <DashboardCard
          title='Transacciones Recientes'
          icon='📝'
          className={styles.fullWidth}
        >
          {recentTransactions.length > 0
            ? (
              <div className={styles.transactionsList}>
                {recentTransactions.map((transaction) => (
                  <div key={transaction._id} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <div className={styles.transactionCategory}>
                        {transaction.category?.name || 'Sin categoría'}
                      </div>
                      <div className={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </div>
                      {transaction.note && (
                        <div className={styles.transactionNote}>
                          {transaction.note}
                        </div>
                      )}
                    </div>
                    <div className={`${styles.transactionAmount} ${
                    transaction.type === TransactionType.Income ? styles.income : styles.expense
                  }`}
                    >
                      {transaction.type === TransactionType.Income ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                  </div>
                ))}
              </div>
              )
            : (
              <p className={styles.noData}>No hay transacciones recientes</p>
              )}
        </DashboardCard>
      </section>
    </div>
  )
}

export default Dashboard
