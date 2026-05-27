import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function serviceRoutes(fastify: FastifyInstance) {
  
  // 1. Ajouter un service additionnel à une annonce (Hôte)
  fastify.post('/api/listings/:id/services', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { name, description, price } = request.body as { name?: string; description?: string; price?: number }
    const userId = (request.user as any).id

    if (!name || !description || price === undefined || price < 0) {
      return reply.status(400).send({ error: 'Champs obligatoires manquants ou invalides : name, description, price.' })
    }

    try {
      const listing = await prisma.listing.findUnique({
        where: { id }
      })

      if (!listing) {
        return reply.status(404).send({ error: 'Annonce non trouvée.' })
      }

      // Seul le propriétaire (ou admin) peut ajouter des services
      if (listing.ownerId !== userId && (request.user as any).role !== 'ADMIN') {
        return reply.status(403).send({ error: "Non autorisé. Seul l'hôte de ce logement peut y ajouter des services additionnels." })
      }

      const newService = await prisma.serviceItem.create({
        data: {
          listingId: id,
          name,
          description,
          price: Number(price)
        }
      })

      return reply.status(201).send({
        success: true,
        message: 'Service additionnel créé avec succès.',
        service: newService
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la création du service.' })
    }
  })

  // 2. Récupérer les services disponibles pour un logement (Public)
  fastify.get('/api/listings/:id/services', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const services = await prisma.serviceItem.findMany({
        where: { listingId: id },
        orderBy: { createdAt: 'asc' }
      })

      return services
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la récupération des services.' })
    }
  })
}
