import { FastifyInstance } from 'fastify'
import { suggestListingPrice } from '../lib/priceCoach'

export async function priceCoachRoutes(fastify: FastifyInstance) {
  fastify.post('/api/listings/price-coach', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { city, bedrooms, bathrooms, amenities, date } = request.body as {
      city?: string
      bedrooms?: number
      bathrooms?: number
      amenities?: string[]
      date?: string
    }

    if (!city) {
      return reply.status(400).send({ error: "Le champ 'city' est requis." })
    }

    try {
      const result = await suggestListingPrice({
        city,
        bedrooms: bedrooms !== undefined ? Number(bedrooms) : 1,
        bathrooms: bathrooms !== undefined ? Number(bathrooms) : 1,
        amenities: amenities || [],
        date
      })

      return reply.send(result)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la suggestion de prix par le coach.' })
    }
  })
}
