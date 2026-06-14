import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app.js'

describe('health endpoint', () => {
    let app: Awaited<ReturnType<typeof buildApp>>

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret'
        process.env.GOOGLE_CLIENT_ID = 'test-client-id'
        app = await buildApp()
    })

    afterAll(async () => {
        await app.close()
    })

    it('returns 200 when healthy', async () => {
        const res = await app.inject({ method: 'GET', url: '/health' })
        expect(res.statusCode).toBe(200)
        const body = res.json()
        expect(body.checks.api).toBe('ok')
    })
})