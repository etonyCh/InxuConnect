import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { generatePresignedPutUrl } from '../lib/r2'
import { optimizeImageUrl } from '../lib/images'
import { generateListingDescription } from '../lib/claude'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function listingRoutes(fastify: FastifyInstance) {
  
  // Accepte tous les content-types pour le mock upload
  fastify.addContentTypeParser('*', (request, payload, done) => {
    done(null, null)
  })

  // 1. Liste de toutes les annonces (avec filtres optionnels)
  fastify.get('/api/listings', async (request) => {
    const { city, maxPrice, hasGenerator, hasWaterTank, hasStarlink } = request.query as {
      city?: string
      maxPrice?: string
      hasGenerator?: string
      hasWaterTank?: string
      hasStarlink?: string
    }

    const where: any = {}

    if (city) {
      where.city = { equals: city, mode: 'insensitive' }
    }

    if (maxPrice) {
      where.price = { lte: parseInt(maxPrice) }
    }

    const amenityFilters: string[] = []
    if (hasGenerator === 'true') amenityFilters.push('generator')
    if (hasWaterTank === 'true') amenityFilters.push('water_tank')
    if (hasStarlink === 'true') amenityFilters.push('starlink')

    if (amenityFilters.length > 0) {
      where.AND = amenityFilters.map(name => ({
        amenities: {
          some: { name }
        }
      }))
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { photos: true, amenities: true }
    })

    const optimizedListings = listings.map(listing => ({
      ...listing,
      photos: listing.photos.map(photo => ({
        ...photo,
        url: optimizeImageUrl(photo.url)
      }))
    }))

    return { data: optimizedListings }
  })

  // 2. Détail d'une annonce
  fastify.get('/api/listings/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { owner: true, photos: true, amenities: true }
    })
    if (!listing) {
      return reply.status(404).send({ error: 'Annonce non trouvée' })
    }
    return {
      ...listing,
      photos: listing.photos.map(photo => ({
        ...photo,
        url: optimizeImageUrl(photo.url)
      }))
    }
  })

  // 3. Obtenir une URL pré-signée pour upload d'une photo (Protégée par token)
  fastify.post('/api/listings/media/presigned', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { fileName, contentType } = request.body as { fileName: string, contentType: string }
    const userId = (request.user as any).id

    if (!fileName || !contentType) {
      return reply.status(400).send({ error: 'fileName et contentType sont requis' })
    }

    const uniqueId = crypto.randomUUID()
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9\.\-_]/g, '')
    const fileKey = `listings/${userId}/${uniqueId}_${sanitizedName}`

    try {
      const { uploadUrl, publicUrl, isMock } = await generatePresignedPutUrl(fileKey, contentType)
      
      return {
        success: true,
        uploadUrl,
        publicUrl,
        fileKey,
        isMock
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la génération de l\'URL d\'upload' })
    }
  })

  // 4. Point de terminaison de simulation de chargement local (Mock)
  fastify.put('/api/listings/media/mock-upload', async (request, reply) => {
    // Simule une réussite d'upload sur S3/R2 en renvoyant un statut 200 OK
    console.log(`[SIMULATEUR R2] Fichier reçu pour la clé: ${request.query as any ? (request.query as any).key : 'inconnue'}`)
    return {
      success: true,
      message: 'Fichier chargé virtuellement sur le simulateur R2'
    }
  })

  // 5. Créer une nouvelle annonce (Protégée)
  fastify.post('/api/listings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id
    const {
      title,
      description: baseDescription,
      price,
      city,
      address,
      bedrooms,
      bathrooms,
      taxiMotoDistance,
      surchargeGenerator,
      photos,
      amenities
    } = request.body as {
      title: string
      description?: string
      price: number
      city: string
      address?: string
      bedrooms?: number
      bathrooms?: number
      taxiMotoDistance?: number
      surchargeGenerator?: number
      photos?: string[]
      amenities?: string[]
    }

    if (!title || !price || !city) {
      return reply.status(400).send({ error: 'title, price, et city sont requis' })
    }

    try {
      // S'assurer que l'utilisateur est enregistré
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé' })
      }
      
      // Auto-promotion de GUEST à HOST si nécessaire
      if (user.role === 'GUEST') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'HOST' }
        })
      }

      // Génération de la description bilingue
      const finalDescription = await generateListingDescription({
        title,
        baseDescription,
        city,
        address,
        bedrooms: bedrooms ? Number(bedrooms) : 1,
        bathrooms: bathrooms ? Number(bathrooms) : 1,
        price: Number(price),
        amenities: amenities || [],
        taxiMotoDistance: taxiMotoDistance ? Number(taxiMotoDistance) : undefined
      })

      // Insertion en base de données
      const listing = await prisma.listing.create({
        data: {
          title,
          description: finalDescription,
          price: Number(price),
          city,
          address,
          bedrooms: bedrooms ? Number(bedrooms) : 1,
          bathrooms: bathrooms ? Number(bathrooms) : 1,
          taxiMotoDistance: taxiMotoDistance ? Number(taxiMotoDistance) : null,
          surchargeGenerator: surchargeGenerator ? Number(surchargeGenerator) : 0,
          ownerId: userId,
          photos: {
            create: (photos || []).map(url => ({ url }))
          },
          amenities: {
            connectOrCreate: (amenities || []).map(name => ({
              where: { name },
              create: { name }
            }))
          }
        },
        include: {
          photos: true,
          amenities: true
        }
      })

      return reply.status(201).send(listing)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la création de l\'annonce' })
    }
  })

  // 6. Mettre à jour une annonce (Protégée par auteur/admin)
  fastify.patch('/api/listings/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id
    const { id } = request.params as { id: string }
    const {
      title,
      description: baseDescription,
      price,
      city,
      address,
      bedrooms,
      bathrooms,
      taxiMotoDistance,
      surchargeGenerator,
      photos,
      amenities
    } = request.body as {
      title?: string
      description?: string
      price?: number
      city?: string
      address?: string
      bedrooms?: number
      bathrooms?: number
      taxiMotoDistance?: number
      surchargeGenerator?: number
      photos?: string[]
      amenities?: string[]
    }

    try {
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: { photos: true, amenities: true }
      })

      if (!listing) {
        return reply.status(404).send({ error: 'Annonce non trouvée' })
      }

      if (listing.ownerId !== userId && (request.user as any).role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Non autorisé à modifier cette annonce' })
      }

      const updateData: any = {}
      if (title !== undefined) updateData.title = title
      if (price !== undefined) updateData.price = Number(price)
      if (city !== undefined) updateData.city = city
      if (address !== undefined) updateData.address = address
      if (bedrooms !== undefined) updateData.bedrooms = Number(bedrooms)
      if (bathrooms !== undefined) updateData.bathrooms = Number(bathrooms)
      if (taxiMotoDistance !== undefined) updateData.taxiMotoDistance = taxiMotoDistance !== null ? Number(taxiMotoDistance) : null
      if (surchargeGenerator !== undefined) updateData.surchargeGenerator = Number(surchargeGenerator)

      const coreDetailsChanged = 
        title !== undefined || 
        city !== undefined || 
        price !== undefined || 
        bedrooms !== undefined || 
        bathrooms !== undefined || 
        baseDescription !== undefined || 
        amenities !== undefined

      if (coreDetailsChanged) {
        const mergedAmenities = amenities !== undefined ? amenities : listing.amenities.map(a => a.name)
        const finalDescription = await generateListingDescription({
          title: title !== undefined ? title : listing.title,
          baseDescription: baseDescription !== undefined ? baseDescription : undefined,
          city: city !== undefined ? city : listing.city,
          address: address !== undefined ? address : (listing.address || undefined),
          bedrooms: bedrooms !== undefined ? Number(bedrooms) : listing.bedrooms,
          bathrooms: bathrooms !== undefined ? Number(bathrooms) : listing.bathrooms,
          price: price !== undefined ? Number(price) : listing.price,
          amenities: mergedAmenities,
          taxiMotoDistance: taxiMotoDistance !== undefined ? (taxiMotoDistance !== null ? Number(taxiMotoDistance) : undefined) : (listing.taxiMotoDistance || undefined)
        })
        updateData.description = finalDescription
      }

      // Mise à jour des photos
      if (photos !== undefined) {
        await prisma.photo.deleteMany({ where: { listingId: id } })
        updateData.photos = {
          create: photos.map(url => ({ url }))
        }
      }

      // Mise à jour des équipements (amenities)
      if (amenities !== undefined) {
        updateData.amenities = {
          set: [],
          connectOrCreate: amenities.map(name => ({
            where: { name },
            create: { name }
          }))
        }
      }

      const updatedListing = await prisma.listing.update({
        where: { id },
        data: updateData,
        include: {
          photos: true,
          amenities: true
        }
      })

      return updatedListing
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la mise à jour de l\'annonce' })
    }
  })

  // 7. Supprimer une annonce (Protégée par auteur/admin)
  fastify.delete('/api/listings/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id
    const { id } = request.params as { id: string }

    try {
      const listing = await prisma.listing.findUnique({
        where: { id }
      })

      if (!listing) {
        return reply.status(404).send({ error: 'Annonce non trouvée' })
      }

      if (listing.ownerId !== userId && (request.user as any).role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Non autorisé à supprimer cette annonce' })
      }

      // Supprimer d'abord les réservations
      await prisma.booking.deleteMany({
        where: { listingId: id }
      })

      // Supprimer l'annonce (photos/availabilities cascade delete)
      await prisma.listing.delete({
        where: { id }
      })

      return { success: true, message: 'Annonce supprimée avec succès' }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la suppression de l\'annonce' })
    }
  })
}
