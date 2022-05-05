import cors from 'cors'

function initCors (app: any) {
  app.use(cors())
  console.log('[server] Loaded cors middleware')
}

module.exports = initCors
