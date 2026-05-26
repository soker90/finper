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
      ...(row.deadline && { deadline: row.deadline }),
      color: row.color,
      icon: row.icon,
      user: row.user
    }
  }
}
