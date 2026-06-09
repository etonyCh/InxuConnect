import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.get('/api/admin/dashboard', { preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])] }, async (request, reply) => {
    try {
      const usersCount = await prisma.user.count()
      const listingsCount = await prisma.listing.count()
      const bookingsCount = await prisma.booking.count()
      const kycCount = await prisma.kycRequest.count({ where: { status: 'PENDING' } })

      const recentUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      })

      const pendingKyc = await prisma.kycRequest.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      })

      return {
        stats: {
          users: usersCount,
          listings: listingsCount,
          bookings: bookingsCount,
          kycPending: kycCount
        },
        recentUsers,
        pendingKyc
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors du chargement des statistiques admin.' })
    }
  })

  fastify.post<{ Params: { id: string }, Body: { status: 'VERIFIED' | 'REJECTED' } }>(
    '/api/admin/kyc/:id/review',
    { preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])] },
    async (request, reply) => {
      try {
        const { id } = request.params
        const { status } = request.body

        if (status !== 'VERIFIED' && status !== 'REJECTED') {
          return reply.status(400).send({ error: 'Status invalide' })
        }

        const kyc = await prisma.kycRequest.findUnique({ where: { id } })
        if (!kyc) return reply.status(404).send({ error: 'KYC introuvable' })

        await prisma.kycRequest.update({
          where: { id },
          data: { status }
        })

        if (status === 'VERIFIED') {
          await prisma.user.update({
            where: { id: kyc.userId },
            data: { kycStatus: 'VERIFIED', badge: 'VERIFIED' }
          })
        } else {
          await prisma.user.update({
            where: { id: kyc.userId },
            data: { kycStatus: 'REJECTED' }
          })
        }

        return { success: true, message: `KYC ${status}` }
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({ error: 'Erreur lors de la révision du KYC' })
      }
    }
  )
}
