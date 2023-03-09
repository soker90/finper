import { Mongoose } from 'mongoose'

export default (mongoose: Mongoose, uri: string, options: Record<string, unknown>) => {
  mongoose.connect(uri, options)

  mongoose.connection.once('connected', () => {
    console.log('[finper-models] Mongoose connected')
  })

  mongoose.connection.once('error', (err: Error) => {
    console.log('[finper-models] Mongoose error: ', err)
    throw err
  })

  mongoose.connection.once('disconnected', () => {
    console.log('[finper-models] Mongoose disconnected')
  })

  process.once('SIGINT', () => mongoose.connection.close().then(() => {
    console.error('[finper-models] Mongoose disconnected')
    process.exit(0)
  })
  )
}
