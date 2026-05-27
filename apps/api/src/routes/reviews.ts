import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { updateSelfReputationAndBadge } from '../lib/reputation'

const prisma = new PrismaClient()

export async function reviewRoutes(fastify: FastifyInstance) {
  
  // 1. Soumettre un avis pour une réservation (Double-blind)
  fastify.post('/api/bookings/:id/reviews', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { rating, comment } = request.body as { rating: number; comment: string }
    const authorId = (request.user as any).id

    if (!rating || rating < 1 || rating > 5 || !comment) {
      return reply.status(400).send({ error: 'La note (1-5) et le commentaire sont requis.' })
    }

    try {
      // Récupérer la réservation pour vérifier le statut et les participants
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { listing: true }
      })

      if (!booking) {
        return reply.status(404).send({ error: 'Réservation non trouvée.' })
      }

      // Vérifier le statut de la réservation
      if (booking.status !== 'CHECKED_IN' && booking.status !== 'COMPLETED') {
        return reply.status(400).send({ 
          error: `Vous ne pouvez pas évaluer cette réservation tant qu'elle n'est pas arrivée (statut actuel: ${booking.status})` 
        })
      }

      // Vérifier le rôle de l'auteur de l'avis
      const isGuest = booking.guestId === authorId
      const isHost = booking.listing.ownerId === authorId

      if (!isGuest && !isHost) {
        return reply.status(403).send({ error: 'Vous ne faites pas partie de cette réservation.' })
      }

      // Déterminer la cible de l'avis
      const targetId = isGuest ? booking.listing.ownerId : booking.guestId

      // Vérifier si cet utilisateur a déjà soumis un avis pour cette réservation
      const existingReview = await prisma.review.findUnique({
        where: {
          bookingId_authorId: {
            bookingId: id,
            authorId
          }
        }
      })

      if (existingReview) {
        return reply.status(400).send({ error: 'Vous avez déjà évalué cette réservation.' })
      }

      // Vérifier si le counterpart a déjà écrit un avis
      const counterpartReview = await prisma.review.findUnique({
        where: {
          bookingId_authorId: {
            bookingId: id,
            authorId: targetId
          }
        }
      })

      let revealedAt: Date | null = null
      let newReview

      if (counterpartReview) {
        // Les deux avis sont maintenant soumis ! Révéler les deux avis.
        revealedAt = new Date()

        await prisma.$transaction([
          prisma.review.create({
            data: {
              bookingId: id,
              authorId,
              targetId,
              rating,
              comment,
              revealedAt
            }
          }),
          prisma.review.update({
            where: {
              bookingId_authorId: {
                bookingId: id,
                authorId: targetId
              }
            },
            data: {
              revealedAt
            }
          })
        ])

        // Recalculer les moyennes et badges pour l'auteur et la cible
        await updateSelfReputationAndBadge(authorId)
        await updateSelfReputationAndBadge(targetId)

        // Récupérer l'avis créé pour le retourner
        newReview = await prisma.review.findUnique({
          where: {
            bookingId_authorId: {
              bookingId: id,
              authorId
            }
          }
        })
      } else {
        // Seul l'auteur actuel a soumis son avis, garder masqué
        newReview = await prisma.review.create({
          data: {
            bookingId: id,
            authorId,
            targetId,
            rating,
            comment,
            revealedAt: null
          }
        })
      }

      return reply.status(201).send({
        success: true,
        message: revealedAt 
          ? 'Avis soumis et révélé car les deux parties ont évalué !' 
          : "Avis soumis. Il restera masqué jusqu'à ce que l'autre partie soumette le sien.",
        review: newReview,
        revealed: revealedAt !== null
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la soumission de l'avis." })
    }
  })

  // 2. Récupérer les avis d'une réservation (Double-blind mask)
  fastify.get('/api/bookings/:id/reviews', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = (request.user as any).id

    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { listing: true }
      })

      if (!booking) {
        return reply.status(404).send({ error: 'Réservation non trouvée.' })
      }

      // Vérifier si l'utilisateur fait partie de la réservation ou est admin
      const isGuest = booking.guestId === userId
      const isHost = booking.listing.ownerId === userId
      const isAdmin = (request.user as any).role === 'ADMIN'

      if (!isGuest && !isHost && !isAdmin) {
        return reply.status(403).send({ error: 'Accès interdit aux avis de cette réservation.' })
      }

      // Récupérer tous les avis de la réservation
      const reviews = await prisma.review.findMany({
        where: { bookingId: id },
        include: {
          author: {
            select: { id: true, name: true }
          }
        }
      })

      // Appliquer les règles de masque double-blind
      const formattedReviews = reviews.map(review => {
        const isAuthor = review.authorId === userId
        // Révélé si revealedAt n'est pas null OU si le demandeur est l'auteur lui-même (il a le droit de voir ce qu'il a écrit)
        if (review.revealedAt !== null || isAuthor || isAdmin) {
          return review
        } else {
          // Masquer le contenu de l'avis du counterpart si non encore révélé
          return {
            id: review.id,
            bookingId: review.bookingId,
            authorId: review.authorId,
            targetId: review.targetId,
            rating: null,
            comment: "Avis en attente de l'autre participant 🔒",
            revealedAt: null,
            createdAt: review.createdAt,
            author: { id: review.author.id, name: "Participant" }
          }
        }
      })

      return formattedReviews
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la récupération des avis.' })
    }
  })

  // 3. Récupérer les avis publics révélés d'un utilisateur (avec moyenne et badge)
  fastify.get('/api/users/:id/reviews', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          badge: true,
          kycStatus: true
        }
      })

      if (!user) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé.' })
      }

      // Récupérer les avis révélés ciblant cet utilisateur
      const reviews = await prisma.review.findMany({
        where: {
          targetId: id,
          revealedAt: { not: null }
        },
        include: {
          author: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Calculer la moyenne
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0

      return {
        user: {
          id: user.id,
          name: user.name,
          badge: user.badge,
          kycStatus: user.kycStatus
        },
        reviews,
        averageRating,
        reviewCount: reviews.length
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: "Erreur lors de la récupération des avis de l'utilisateur." })
    }
  })
}
