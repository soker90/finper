import { Request } from 'express'

export default (req: Request) => (data: any) => ({ ...data, user: req.user })
