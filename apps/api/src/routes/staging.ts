import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function stagingRoutes(fastify: FastifyInstance) {

  // 1. Demander un Staging Virtuel 3D pour un logement (Facturé 5 000 BIF)
  fastify.post('/api/host/listings/:id/staging', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = (request.user as any).id
    const { payWithSavings, phone, provider } = request.body as {
      payWithSavings?: boolean
      phone?: string
      provider?: 'ECOCASH' | 'LUMICASH'
    }

    try {
      // Vérifier le logement et la propriété
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: { owner: true }
      })

      if (!listing) {
        return reply.status(404).send({ error: 'Logement introuvable' })
      }

      if (listing.ownerId !== userId) {
        return reply.status(403).send({ error: 'Non autorisé : vous devez être le propriétaire de ce logement' })
      }

      // Gérer la facturation de 5 000 BIF
      const cost = 5000
      const owner = listing.owner

      if (payWithSavings) {
        if (owner.savingsBalance < cost) {
          return reply.status(400).send({ error: `Solde d'épargne insuffisant (${owner.savingsBalance} BIF). Le coût est de ${cost} BIF.` })
        }

        // Déduction du solde d'épargne
        await prisma.user.update({
          where: { id: userId },
          data: { savingsBalance: { decrement: cost } }
        })
      } else {
        // Paiement mobile money simulé
        if (!phone || !provider) {
          return reply.status(400).send({ error: 'Veuillez spécifier le numéro de téléphone et le fournisseur (ECOCASH/LUMICASH) pour le paiement.' })
        }
        // Simulation de facturation mobile money réussie...
        fastify.log.info(`Paiement Mobile Money de ${cost} BIF initié pour le staging virtuel sur ${phone} via ${provider}`)
      }

      // Création de la demande de staging virtuel
      // Pour simuler la reconstitution IA 3D, nous générons un canevas 3D JSON contenant des informations de mobilier
      const mockSceneData = {
        roomType: 'bedroom',
        dimensions: { width: 4.5, height: 2.8, depth: 4.0 },
        furniture: [
          { type: 'bed', position: { x: 0, y: 0.4, z: -1 }, rotation: 0, color: '#1E3A8A' },
          { type: 'bedside_table', position: { x: -1.5, y: 0.25, z: -1.5 }, rotation: 0, color: '#78350F' },
          { type: 'wardrobe', position: { x: 1.8, y: 1.0, z: 1.2 }, rotation: 90, color: '#78350F' },
          { type: 'window', position: { x: 0, y: 1.5, z: -2.0 }, dimensions: { w: 1.2, h: 1.2 } },
          { type: 'light', position: { x: 0, y: 2.7, z: 0 }, intensity: 1.5 }
        ],
        wallColor: '#F5F5F4',
        floorTexture: 'wood'
      }

      const stagingRequest = await prisma.virtualStagingRequest.create({
        data: {
          listingId: id,
          status: 'COMPLETED', // Pour les tests et la démo, nous le mettons directement au statut COMPLETED
          sceneUrl: JSON.stringify(mockSceneData),
          price: cost
        }
      })

      return reply.status(201).send({
        success: true,
        message: 'Staging virtuel IA complété avec succès !',
        stagingRequest: {
          id: stagingRequest.id,
          listingId: stagingRequest.listingId,
          status: stagingRequest.status,
          price: stagingRequest.price,
          scene: mockSceneData
        }
      })

    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de l\'initialisation du Staging Virtuel' })
    }
  })

  // 2. Consulter le Staging Virtuel d'un logement (Public)
  fastify.get('/api/listings/:id/staging', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const stagingRequest = await prisma.virtualStagingRequest.findFirst({
        where: {
          listingId: id,
          status: 'COMPLETED'
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!stagingRequest) {
        return reply.status(404).send({ error: 'Aucun staging virtuel disponible ou complété pour ce logement' })
      }

      return {
        success: true,
        stagingRequest: {
          id: stagingRequest.id,
          listingId: stagingRequest.listingId,
          status: stagingRequest.status,
          scene: stagingRequest.sceneUrl ? JSON.parse(stagingRequest.sceneUrl) : null,
          createdAt: stagingRequest.createdAt
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la récupération du staging' })
    }
  })
}
