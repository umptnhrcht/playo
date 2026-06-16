import { buildApp } from './app'

process.loadEnvFile();
async function main() {
  const port = Number(process.env.PORT ?? 3000)
  const host = process.env.HOST ?? '0.0.0.0'

  const app = await buildApp()

  try {
    await app.listen({ port, host })
    app.log.info(`Playo API running on ${host}:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()