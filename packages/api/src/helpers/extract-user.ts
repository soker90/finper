import { Request } from 'express'

export default (req: Request) => (data: any) => ({ user: req.user, ...data })
