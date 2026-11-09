import express from 'express'
import request from 'supertest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import config from '../config'

describe('Client static distribution & SPA serving', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finper-test-client-'))
  const indexHtmlContent = '<!DOCTYPE html><html><head><title>Finper Test</title></head><body><div id="root"></div></body></html>'

  beforeAll(() => {
    fs.writeFileSync(path.join(tempDir, 'index.html'), indexHtmlContent)
    fs.writeFileSync(path.join(tempDir, 'sample.txt'), 'hello static')
  })

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('serves static files and falls back to index.html for SPA routes when enabled', async () => {
    const app = express()

    // Simulate Server.clientStaticConfig behavior
    const origServe = config.client.serve
    const origDist = config.client.distPath

    config.client.serve = true
    config.client.distPath = tempDir

    app.use('/api/sample', (_req, res) => {
      res.json({ ok: true })
    })

    if (config.client.serve && fs.existsSync(config.client.distPath)) {
      app.use(express.static(config.client.distPath))
      app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
          const indexHtml = path.join(config.client.distPath, 'index.html')
          if (fs.existsSync(indexHtml)) {
            return res.sendFile(indexHtml)
          }
        }
        next()
      })
    }

    // 1. Static asset
    const staticRes = await request(app).get('/sample.txt')
    expect(staticRes.status).toBe(200)
    expect(staticRes.text).toBe('hello static')

    // 2. SPA route (should return index.html)
    const spaRes = await request(app).get('/dashboard/analytics')
    expect(spaRes.status).toBe(200)
    expect(spaRes.text).toBe(indexHtmlContent)

    // 3. API route (should not return index.html)
    const apiRes = await request(app).get('/api/sample')
    expect(apiRes.status).toBe(200)
    expect(apiRes.body).toEqual({ ok: true })

    // Restore config
    config.client.serve = origServe
    config.client.distPath = origDist
  })
})
