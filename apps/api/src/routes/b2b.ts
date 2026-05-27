import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Middleware pour s'assurer que l'utilisateur appartient à une entreprise B2B
async function requireCompanyUser(request: any, reply: any) {
  const user = await prisma.user.findUnique({
    where: { id: request.user?.id },
    select: { b2bCompanyId: true }
  })
  if (!user || !user.b2bCompanyId) {
    return reply.status(403).send({ error: "Accès interdit - Votre compte n'est lié à aucune entreprise B2B." })
  }
  request.b2bCompanyId = user.b2bCompanyId
}

export async function b2bRoutes(fastify: FastifyInstance) {
  
  // 1. Enregistrer une nouvelle entreprise B2B (et y lier le créateur)
  fastify.post('/api/b2b/register', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name, tier } = request.body as { name?: string, tier?: string }
    const userId = (request.user as any).id

    if (!name || !tier) {
      return reply.status(400).send({ error: "Les champs 'name' et 'tier' (PME ou ONG_INTERNATIONALE) sont requis." })
    }

    if (tier !== 'PME' && tier !== 'ONG_INTERNATIONALE') {
      return reply.status(400).send({ error: "Le niveau d'abonnement 'tier' doit être 'PME' ou 'ONG_INTERNATIONALE'." })
    }

    // PME : 50 000 FBu/mois, ONG : 200 000 FBu/mois
    const saasFee = tier === 'PME' ? 50000 : 200000

    try {
      // Créer la compagnie et lier l'utilisateur dans une transaction
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.b2bCompany.create({
          data: {
            name,
            tier,
            saasFee,
            maxPricePerNight: 100000 // Limite par défaut
          }
        })

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            b2bCompanyId: company.id
          },
          select: {
            id: true,
            name: true,
            email: true,
            b2bCompanyId: true
          }
        })

        return { company, user: updatedUser }
      })

      return reply.status(201).send({
        success: true,
        message: 'Entreprise B2B enregistrée et liée à votre profil avec succès.',
        company: result.company,
        user: result.user
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la création de l'entreprise B2B." })
    }
  })

  // 2. Inviter un employé à rejoindre l'entreprise B2B
  fastify.post('/api/b2b/invite', { preHandler: [fastify.authenticate, requireCompanyUser] }, async (request, reply) => {
    const { email, phone } = request.body as { email?: string, phone?: string }
    const companyId = (request as any).b2bCompanyId

    if (!email && !phone) {
      return reply.status(400).send({ error: "Veuillez spécifier l'adresse email ou le numéro de téléphone de l'employé." })
    }

    try {
      // Trouver l'utilisateur cible
      const targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            email ? { email: email.toLowerCase() } : undefined,
            phone ? { phone: phone } : undefined
          ].filter(Boolean) as any
        }
      })

      if (!targetUser) {
        return reply.status(404).send({ error: "Utilisateur introuvable avec ces coordonnées." })
      }

      if (targetUser.b2bCompanyId) {
        return reply.status(400).send({ error: "Cet utilisateur appartient déjà à une entreprise B2B." })
      }

      // Liaison de l'utilisateur à l'entreprise
      const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: { b2bCompanyId: companyId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          b2bCompanyId: true
        }
      })

      return {
        success: true,
        message: `L'employé ${updatedUser.name} a été rattaché à votre entreprise avec succès.`,
        user: updatedUser
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors du rattachement de l'employé." })
    }
  })

  // 3. Configurer la politique de voyage (Prix maximum par nuit)
  fastify.patch('/api/b2b/policy', { preHandler: [fastify.authenticate, requireCompanyUser] }, async (request, reply) => {
    const { maxPricePerNight } = request.body as { maxPricePerNight?: number }
    const companyId = (request as any).b2bCompanyId

    if (maxPricePerNight === undefined || isNaN(Number(maxPricePerNight))) {
      return reply.status(400).send({ error: "Le paramètre 'maxPricePerNight' doit être un nombre valide." })
    }

    try {
      const updatedCompany = await prisma.b2bCompany.update({
        where: { id: companyId },
        data: { maxPricePerNight: Number(maxPricePerNight) }
      })

      return {
        success: true,
        message: "Politique de voyage mise à jour avec succès.",
        company: updatedCompany
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la mise à jour de la politique." })
    }
  })

  // 4. Tableau de bord B2B de l'entreprise (réservations d'équipe & facturation consolidée)
  fastify.get('/api/b2b/dashboard', { preHandler: [fastify.authenticate, requireCompanyUser] }, async (request, reply) => {
    const companyId = (request as any).b2bCompanyId

    try {
      // Récupérer la compagnie avec ses employés
      const company = await prisma.b2bCompany.findUnique({
        where: { id: companyId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true
            }
          }
        }
      })

      if (!company) {
        return reply.status(404).send({ error: "Entreprise introuvable." })
      }

      // Récupérer toutes les réservations d'équipe
      const bookings = await prisma.booking.findMany({
        where: { b2bCompanyId: companyId },
        orderBy: { createdAt: 'desc' },
        include: {
          guest: {
            select: { id: true, name: true, email: true }
          },
          listing: {
            select: { id: true, title: true, price: true, city: true }
          }
        }
      })

      // Calcul de la facture consolidée
      // 1. Somme des réservations non annulées
      const activeBookings = bookings.filter(b => b.status !== 'CANCELLED')
      const totalBookingsAmount = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0)

      // 2. Montant consolidé total (bookings + SaaS fee mensuel)
      const totalInvoiceAmount = totalBookingsAmount + company.saasFee

      return {
        company,
        employees: company.users,
        employeesCount: company.users.length,
        bookings,
        billingSummary: {
          saasFee: company.saasFee,
          bookingsCount: activeBookings.length,
          bookingsTotalAmount: totalBookingsAmount,
          totalInvoiceAmount
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la récupération des données B2B." })
    }
  })
}
