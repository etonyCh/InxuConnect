import fp from 'fastify-plugin'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export default fp(async function (fastify: FastifyInstance) {
  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.status(401).send({ error: 'Non autorisé - Token manquant ou invalide' })
      }
    }
  )

  fastify.decorate(
    'requireRole',
    function (allowedRoles: string[]) {
      return async function (request: FastifyRequest, reply: FastifyReply) {
        const user = request.user as any
        if (!user || !user.role || !allowedRoles.includes(user.role)) {
          return reply.status(403).send({ error: 'Accès interdit - Droits insuffisants' })
        }
      }
    }
  )
})
