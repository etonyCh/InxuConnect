import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function savingsRoutes(fastify: FastifyInstance) {
  
  // 1. Consulter le solde d'épargne et le statut d'activation
  fastify.get('/api/host/savings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          microSavingsEnabled: true,
          savingsBalance: true,
          role: true
        }
      })

      if (!user) {
        return reply.status(404).send({ error: "Utilisateur introuvable." })
      }

      if (user.role !== 'HOST' && (request.user as any).role !== 'ADMIN') {
        return reply.status(403).send({ error: "Accès interdit - Cette fonctionnalité est réservée aux Hôtes." })
      }

      return {
        microSavingsEnabled: user.microSavingsEnabled,
        savingsBalance: user.savingsBalance
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la récupération du solde d'épargne." })
    }
  })

  // 2. Activer / Désactiver la micro-épargne automatique de 10%
  fastify.post('/api/host/savings/toggle', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id
    const { enabled } = request.body as { enabled?: boolean }

    if (enabled === undefined) {
      return reply.status(400).send({ error: "Le paramètre 'enabled' (true ou false) est requis." })
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return reply.status(404).send({ error: "Utilisateur introuvable." })
      }

      if (user.role !== 'HOST' && (request.user as any).role !== 'ADMIN') {
        return reply.status(403).send({ error: "Accès interdit - Cette fonctionnalité est réservée aux Hôtes." })
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { microSavingsEnabled: enabled },
        select: {
          microSavingsEnabled: true,
          savingsBalance: true
        }
      })

      const stateLabel = enabled ? 'activée' : 'désactivée'
      return {
        success: true,
        message: `La micro-épargne automatique a été ${stateLabel} avec succès.`,
        microSavingsEnabled: updatedUser.microSavingsEnabled,
        savingsBalance: updatedUser.savingsBalance
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la configuration de l'épargne." })
    }
  })

  // 3. Retirer de l'argent vers le compte Lumicash/EcoCash principal
  fastify.post('/api/host/savings/withdraw', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id
    const { amount } = request.body as { amount?: number }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return reply.status(400).send({ error: "Le montant du retrait 'amount' doit être un nombre supérieur à 0." })
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return reply.status(404).send({ error: "Utilisateur introuvable." })
      }

      if (user.role !== 'HOST' && (request.user as any).role !== 'ADMIN') {
        return reply.status(403).send({ error: "Accès interdit - Cette fonctionnalité est réservée aux Hôtes." })
      }

      if (user.savingsBalance < Number(amount)) {
        return reply.status(400).send({
          error: `Solde d'épargne insuffisant. Solde disponible : ${user.savingsBalance.toLocaleString()} BIF.`
        })
      }

      // Déduction du solde d'épargne
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          savingsBalance: {
            decrement: Number(amount)
          }
        },
        select: {
          savingsBalance: true,
          phone: true
        }
      })

      return {
        success: true,
        message: `Le retrait de ${Number(amount).toLocaleString()} BIF vers votre compte mobile money (${updatedUser.phone || 'par défaut'}) a été effectué avec succès.`,
        savingsBalance: updatedUser.savingsBalance
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la transaction de retrait d'épargne." })
    }
  })
}
