import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function kycRoutes(fastify: FastifyInstance) {
  
  // 1. Soumission des pièces d'identité (Protégée par token)
  fastify.post('/api/kyc/submit', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { cniUrl, selfieUrl } = request.body as { cniUrl: string, selfieUrl: string }
    const userId = (request.user as any).id

    if (!cniUrl || !selfieUrl) {
      return reply.status(400).send({ error: "CNI URL et Selfie URL requis" })
    }

    try {
      // Upsert de la demande KYC
      const kycRequest = await prisma.kycRequest.upsert({
        where: { userId },
        create: {
          userId,
          cniUrl,
          selfieUrl,
          status: 'PENDING'
        },
        update: {
          cniUrl,
          selfieUrl,
          status: 'PENDING'
        }
      })

      // Passage du statut KYC de l'utilisateur à PENDING
      await prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'PENDING' }
      })

      return {
        success: true,
        message: 'Demande KYC soumise et en cours d\'examen',
        kycRequest
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la soumission du KYC' })
    }
  })

  // 2. Webhook de simulation de Smile Identity (Public)
  fastify.post('/api/kyc/webhook', async (request, reply) => {
    const { userId, result } = request.body as { userId: string, result: 'APPROVED' | 'REJECTED' }

    if (!userId || !result) {
      return reply.status(400).send({ error: "userId et result (APPROVED/REJECTED) requis" })
    }

    try {
      const kycStatus = result === 'APPROVED' ? 'VERIFIED' : 'REJECTED'
      const badge = result === 'APPROVED' ? 'VERIFIED' : 'NONE'

      // Met à jour la demande de KYC en base
      await prisma.kycRequest.update({
        where: { userId },
        data: { status: kycStatus }
      })

      // Met à jour le statut KYC et le badge de confiance sur le profil utilisateur
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { kycStatus, badge }
      })

      return {
        success: true,
        message: `Webhook KYC traité. Utilisateur mis à jour avec le statut: ${kycStatus} et badge: ${badge}`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          kycStatus: updatedUser.kycStatus,
          badge: updatedUser.badge
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors du traitement du Webhook KYC' })
    }
  })
}
