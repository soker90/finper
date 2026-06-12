export const serializeUser = (user: { id: string, username: string, isActive: boolean | null, createdAt: Date }) => ({
  id: user.id,
  username: user.username,
  isActive: user.isActive,
  createdAt: user.createdAt.getTime()
})
