import fp from 'fastify-plugin'
import sensible, { FastifySensibleOptions } from '@fastify/sensible'

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
const sensiblePlugin = fp<FastifySensibleOptions>(async (fastify) => {
  fastify.register(sensible)
})

export default sensiblePlugin;