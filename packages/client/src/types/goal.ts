export interface Goal {
  _id?: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string | null
  color: string
  icon: string
  user?: string
}
