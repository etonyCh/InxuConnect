import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Middleware pour authentifier le partenaire externe via X-Partner-Key
async function authenticatePartner(request: FastifyRequest, reply: FastifyReply) {
  const partnerKey = request.headers['x-partner-key'] as string

  if (!partnerKey) {
    return reply.status(401).send({ error: 'Clé partenaire manquante dans les headers (X-Partner-Key)' })
  }

  const partner = await prisma.partner.findUnique({
    where: { apiKey: partnerKey }
  })

  if (!partner) {
    return reply.status(401).send({ error: 'Clé partenaire invalide ou expirée' })
  }

  // Stocke le partenaire dans la requête pour utilisation ultérieure
  (request as any).partner = partner
}

export async function partnerRoutes(fastify: FastifyInstance) {

  // 1. Pousser une annonce depuis une plateforme partenaire
  fastify.post('/api/partners/listings', { preHandler: [authenticatePartner] }, async (request, reply) => {
    const { title, description, price, city, address, bedrooms, bathrooms, ownerId, amenities, photos } = request.body as {
      title: string
      description: string
      price: number
      city: string
      address?: string
      bedrooms?: number
      bathrooms?: number
      ownerId: string
      amenities?: string[]
      photos?: string[]
    }

    if (!title || !description || !price || !city || !ownerId) {
      return reply.status(400).send({ error: 'Champs obligatoires manquants : title, description, price, city, ownerId' })
    }

    try {
      // Vérifier si le propriétaire existe
      const owner = await prisma.user.findUnique({
        where: { id: ownerId }
      })

      if (!owner) {
        return reply.status(400).send({ error: `Propriétaire introuvable avec l'ID : ${ownerId}` })
      }

      // Création du logement
      const listing = await prisma.listing.create({
        data: {
          title,
          description,
          price,
          city,
          address,
          bedrooms: bedrooms ?? 1,
          bathrooms: bathrooms ?? 1,
          ownerId,
          // Relation many-to-many avec Amenity
          amenities: amenities && amenities.length > 0 ? {
            connectOrCreate: amenities.map(name => ({
              where: { name },
              create: { name }
            }))
          } : undefined,
          // Relation one-to-many avec Photo
          photos: photos && photos.length > 0 ? {
            create: photos.map(url => ({ url }))
          } : undefined
        },
        include: {
          amenities: true,
          photos: true
        }
      })

      return reply.status(201).send({
        success: true,
        message: 'Logement importé avec succès par API partenaire',
        listing
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la création du logement via API partenaire' })
    }
  })

  // 2. Récupérer les réservations pour synchronisation
  fastify.get('/api/partners/bookings', { preHandler: [authenticatePartner] }, async (request, reply) => {
    const { listingId } = request.query as { listingId?: string }

    try {
      const bookings = await prisma.booking.findMany({
        where: listingId ? { listingId } : {},
        include: {
          listing: true,
          guest: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          payment: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return {
        success: true,
        count: bookings.length,
        bookings
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la récupération des réservations' })
    }
  })
}
