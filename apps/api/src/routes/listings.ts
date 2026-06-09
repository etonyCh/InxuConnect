import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { generatePresignedPutUrl } from '../lib/r2'
import { optimizeImageUrl } from '../lib/images'
import { generateListingDescription } from '../lib/claude'
import { convertCurrency } from '../lib/currency'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export async function listingRoutes(fastify: FastifyInstance) {
  
  // Accepte tous les content-types pour l'upload binaire
  fastify.addContentTypeParser('*', { parseAs: 'buffer' }, (request, body, done) => {
    done(null, body)
  })

  // 1. Liste de toutes les annonces (avec filtres optionnels)
  fastify.get('/api/listings', async (request) => {
    const { city, country, maxPrice, hasGenerator, hasWaterTank, hasStarlink, targetCurrency, ownerId } = request.query as {
      city?: string
      country?: string
      maxPrice?: string
      hasGenerator?: string
      hasWaterTank?: string
      hasStarlink?: string
      targetCurrency?: string
      ownerId?: string
    }

    const where: any = {}

    if (ownerId) {
      where.ownerId = ownerId
    }

    if (city) {
      where.city = { equals: city, mode: 'insensitive' }
    }

    if (country) {
      where.country = { equals: country, mode: 'insensitive' }
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

    const optimizedListings = listings.map(listing => {
      const displayPrice = targetCurrency 
        ? convertCurrency(listing.price, listing.currency, targetCurrency)
        : listing.price
      const displayCurrency = targetCurrency ? targetCurrency.toUpperCase() : listing.currency

      return {
        ...listing,
        price: displayPrice,
        currency: displayCurrency,
        photos: listing.photos.map(photo => ({
          ...photo,
          url: optimizeImageUrl(photo.url)
        }))
      }
    })

    return { data: optimizedListings }
  })

  // 2. Détail d'une annonce
  fastify.get('/api/listings/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { targetCurrency } = request.query as { targetCurrency?: string }
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { owner: true, photos: true, amenities: true }
    })
    if (!listing) {
      return reply.status(404).send({ error: 'Annonce non trouvée' })
    }

    const displayPrice = targetCurrency 
      ? convertCurrency(listing.price, listing.currency, targetCurrency)
      : listing.price
    const displayCurrency = targetCurrency ? targetCurrency.toUpperCase() : listing.currency

    return {
      ...listing,
      price: displayPrice,
      currency: displayCurrency,
      photos: listing.photos.map(photo => ({
        ...photo,
        url: optimizeImageUrl(photo.url)
      }))
    }
  })

  // 3. Obtenir une URL pré-signée pour upload d'une photo (Protégée par token)
  fastify.post('/api/listings/media/presigned', { preHandler: [fastify.authenticate, fastify.requireRole(['HOST', 'AGENT', 'ADMIN'])] }, async (request, reply) => {
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

  // 4. Point de terminaison de simulation de chargement local (Local Disk)
  fastify.put('/api/listings/media/mock-upload', async (request, reply) => {
    const key = (request.query as any).key
    if (!key) return reply.status(400).send({ error: 'key manquant' })

    const filePath = path.join(process.cwd(), 'uploads', key)
    
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, request.body as Buffer)
      console.log(`[LOCAL UPLOAD] Fichier sauvegardé: ${filePath}`)
      return {
        success: true,
        message: 'Fichier sauvegardé localement sur le disque'
      }
    } catch (err) {
      fastify.log.error(err)
      return reply.status(500).send({ error: 'Erreur lors de la sauvegarde locale' })
    }
  })

  // 5. Créer une nouvelle annonce (Protégée)
  fastify.post('/api/listings', { preHandler: [fastify.authenticate, fastify.requireRole(['HOST', 'AGENT', 'ADMIN'])] }, async (request, reply) => {
    const userId = (request.user as any).id
    const {
      title,
      description: baseDescription,
      price,
      city,
      country,
      currency,
      address,
      bedrooms,
      bathrooms,
      taxiMotoDistance,
      surchargeGenerator,
      photos,
      amenities,
      latitude,
      longitude
    } = request.body as {
      title: string
      description?: string
      price: number
      city: string
      country?: string
      currency?: string
      address?: string
      bedrooms?: number
      bathrooms?: number
      taxiMotoDistance?: number
      surchargeGenerator?: number
      photos?: string[]
      amenities?: string[]
      latitude?: number
      longitude?: number
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
          country: country || 'Burundi',
          currency: currency || 'BIF',
          address,
          bedrooms: bedrooms ? Number(bedrooms) : 1,
          bathrooms: bathrooms ? Number(bathrooms) : 1,
          taxiMotoDistance: taxiMotoDistance ? Number(taxiMotoDistance) : null,
          surchargeGenerator: surchargeGenerator ? Number(surchargeGenerator) : 0,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
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
  fastify.patch('/api/listings/:id', { preHandler: [fastify.authenticate, fastify.requireRole(['HOST', 'AGENT', 'ADMIN'])] }, async (request, reply) => {
    const userId = (request.user as any).id
    const { id } = request.params as { id: string }
    const {
      title,
      description: baseDescription,
      price,
      city,
      country,
      currency,
      address,
      bedrooms,
      bathrooms,
      taxiMotoDistance,
      surchargeGenerator,
      photos,
      amenities,
      latitude,
      longitude
    } = request.body as {
      title?: string
      description?: string
      price?: number
      city?: string
      country?: string
      currency?: string
      address?: string
      bedrooms?: number
      bathrooms?: number
      taxiMotoDistance?: number
      surchargeGenerator?: number
      photos?: string[]
      amenities?: string[]
      latitude?: number
      longitude?: number
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
      if (country !== undefined) updateData.country = country
      if (currency !== undefined) updateData.currency = currency
      if (address !== undefined) updateData.address = address
      if (bedrooms !== undefined) updateData.bedrooms = Number(bedrooms)
      if (bathrooms !== undefined) updateData.bathrooms = Number(bathrooms)
      if (taxiMotoDistance !== undefined) updateData.taxiMotoDistance = taxiMotoDistance !== null ? Number(taxiMotoDistance) : null
      if (surchargeGenerator !== undefined) updateData.surchargeGenerator = Number(surchargeGenerator)
      if (latitude !== undefined) updateData.latitude = latitude !== null ? Number(latitude) : null
      if (longitude !== undefined) updateData.longitude = longitude !== null ? Number(longitude) : null

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
  fastify.delete('/api/listings/:id', { preHandler: [fastify.authenticate, fastify.requireRole(['HOST', 'AGENT', 'ADMIN'])] }, async (request, reply) => {
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
