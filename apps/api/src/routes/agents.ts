import { FastifyInstance } from 'fastify'
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateListingDescription } from '../lib/claude'

const prisma = new PrismaClient()

// Middleware pour s'assurer que l'utilisateur est un Agent
async function requireAgent(request: any, reply: any) {
  const role = request.user?.role
  if (role !== 'AGENT' && role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Accès interdit - Seuls les agents et administrateurs y ont accès.' })
  }
}

export async function agentRoutes(fastify: FastifyInstance) {
  
  // 1. Enregistrer un Hôte sous parrainage Agent
  fastify.post('/api/agents/register-host', { preHandler: [fastify.authenticate, requireAgent] }, async (request, reply) => {
    const { name, email, password, phone } = request.body as {
      name?: string
      email?: string
      password?: string
      phone?: string
    }
    const agentId = (request.user as any).id

    if (!name || !email || !password || !phone) {
      return reply.status(400).send({ error: 'Champs requis manquants : name, email, password, phone.' })
    }

    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { phone: phone }
          ]
        }
      })

      if (existingUser) {
        return reply.status(400).send({ error: 'Un utilisateur avec cet email ou ce numéro de téléphone existe déjà.' })
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)

      // Créer l'Hôte parrainé
      const newHost = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone,
          role: Role.HOST,
          referredByAgentId: agentId
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          referredByAgentId: true,
          createdAt: true
        }
      })

      return reply.status(201).send({
        success: true,
        message: 'Hôte enregistré et lié à votre profil agent avec succès.',
        user: newHost
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la création de l'hôte." })
    }
  })

  // 2. Créer une annonce pour le compte d'un Hôte parrainé
  fastify.post('/api/agents/listings', { preHandler: [fastify.authenticate, requireAgent] }, async (request, reply) => {
    const {
      title,
      description: baseDescription,
      price,
      city,
      address,
      ownerId,
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
      ownerId?: string
      bedrooms?: number
      bathrooms?: number
      taxiMotoDistance?: number
      surchargeGenerator?: number
      photos?: string[]
      amenities?: string[]
    }
    const agentId = (request.user as any).id

    if (!title || !price || !city || !ownerId) {
      return reply.status(400).send({ error: 'Champs requis manquants : title, price, city, ownerId.' })
    }

    try {
      // S'assurer que le ownerId est un hôte géré par cet agent (ou admin)
      const host = await prisma.user.findUnique({
        where: { id: ownerId }
      })

      if (!host) {
        return reply.status(404).send({ error: 'Hôte introuvable.' })
      }

      const isReferredByAgent = host.referredByAgentId === agentId
      const isAdmin = (request.user as any).role === 'ADMIN'

      if (!isReferredByAgent && !isAdmin) {
        return reply.status(403).send({ error: "Accès refusé. Cet hôte n'est pas parrainé par votre compte agent." })
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

      // Création de l'annonce
      const newListing = await prisma.listing.create({
        data: {
          title,
          description: finalDescription,
          price: Number(price),
          city,
          address: address || '',
          bedrooms: bedrooms ? Number(bedrooms) : 1,
          bathrooms: bathrooms ? Number(bathrooms) : 1,
          taxiMotoDistance: taxiMotoDistance ? Number(taxiMotoDistance) : null,
          surchargeGenerator: surchargeGenerator ? Number(surchargeGenerator) : 0,
          ownerId,
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

      return reply.status(201).send({
        success: true,
        message: 'Annonce créée avec succès pour votre hôte parrainé.',
        listing: newListing
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la création de l'annonce par l'agent." })
    }
  })

  // 3. Tableau de bord de l'Agent
  fastify.get('/api/agents/dashboard', { preHandler: [fastify.authenticate, requireAgent] }, async (request, reply) => {
    const agentId = (request.user as any).id

    try {
      // 1. Récupérer la liste des hôtes parrainés
      const referredHosts = await prisma.user.findMany({
        where: { referredByAgentId: agentId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          badge: true,
          listings: {
            select: {
              id: true,
              title: true,
              price: true,
              city: true,
              bookings: {
                select: {
                  id: true,
                  status: true,
                  totalPrice: true
                }
              }
            }
          }
        }
      })

      // 2. Récupérer toutes les commissions d'agent reçues
      const commissions = await prisma.agentCommission.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' }
      })

      // 3. Calculer la somme totale en BIF
      const totalEarnedBif = commissions.reduce((sum, c) => sum + c.amount, 0)

      return {
        hosts: referredHosts,
        hostsCount: referredHosts.length,
        commissions,
        totalEarnedBif
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors du chargement du tableau de bord de l'agent." })
    }
  })
}
