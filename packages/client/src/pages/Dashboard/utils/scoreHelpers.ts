export const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
  if (score >= 70) return 'success'
  if (score >= 40) return 'warning'
  return 'error'
}

export const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Buena'
  if (score >= 40) return 'Regular'
  return 'Necesita atención'
}
