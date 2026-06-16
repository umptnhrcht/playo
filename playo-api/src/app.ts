// import { join } from 'node:path'
// import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
// import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'

// export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {

// }
// // Pass --options via CLI arguments in command to enable these options.
// const options: AppOptions = {
// }

// const app: FastifyPluginAsync<AppOptions> = async (
//   fastify,
//   opts
// ): Promise<void> => {
//   // Place here your custom code!

//   // Do not touch the following lines

//   // This loads all plugins defined in plugins
//   // those should be support plugins that are reused
//   // through your application
//   // eslint-disable-next-line no-void
//   void fastify.register(AutoLoad, {
//     dir: join(__dirname, 'plugins'),
//     options: opts
//   })

//   // This loads all plugins defined in routes
//   // define your routes in one of these
//   // eslint-disable-next-line no-void
//   void fastify.register(AutoLoad, {
//     dir: join(__dirname, 'routes'),
//     options: opts
//   })
// }

// export default app
// export { app, options }



import Fastify from 'fastify'
import { corsPlugin } from './plugins/cors'
import { helmetPlugin } from './plugins/helmet.js'
import { jwtPlugin } from './plugins/jwt.js'
import { prismaPlugin } from './plugins/prisma.js'
import { redisPlugin } from './plugins/redis.js'
import { authRoutes } from './routes/auth/index.js'
import { gameRoutes } from './routes/games/index.js'
import { userRoutes } from './routes/users/index.js'
import { healthRoutes } from './routes/health.js'
import sensiblePlugin from './plugins/sensible'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
    },
  })

  // ── Plugins (order matters) ──────────────────────────────────
  await app.register(helmetPlugin)
  await app.register(corsPlugin)
  await app.register(sensiblePlugin)
  await app.register(prismaPlugin)
  await app.register(redisPlugin)
  await app.register(jwtPlugin)

  // ── Routes ───────────────────────────────────────────────────
  await app.register(healthRoutes)
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(gameRoutes, { prefix: '/games' })
  await app.register(userRoutes, { prefix: '/users' })

  return app
}