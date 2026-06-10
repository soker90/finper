import { schema } from '@soker90/finper-db'
import { InferSelectModel } from 'drizzle-orm'

export type GoalRow = InferSelectModel<typeof schema.goals>

export const goalsSerializer = {
  toJson (row: GoalRow) {
    return {
      _id: row.id,
      name: row.name,
      targetAmount: row.targetAmount,
      currentAmount: row.currentAmount,
      // Se mantiene la serialización a ISO string para preservar el contrato histórico con el front
      // (a diferencia de otras fechas que viajan como raw number ms).
      ...(row.deadline && { deadline: new Date(row.deadline).toISOString() }),
      color: row.color,
      icon: row.icon,
      user: row.user
    }
  }
}
