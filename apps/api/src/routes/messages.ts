import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { translateMessage } from '../lib/translation'

const prisma = new PrismaClient()

export async function messageRoutes(fastify: FastifyInstance) {
  
  // 1. Envoyer un message dans le chat d'une réservation (Traduction automatique intégrée)
  fastify.post('/api/bookings/:id/messages', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: bookingId } = request.params as { id: string }
    const { body, lang } = request.body as { body: string, lang: 'FR' | 'RN' }
    const userId = (request.user as any).id

    if (!body || !lang || (lang !== 'FR' && lang !== 'RN')) {
      return reply.status(400).send({ error: "Champs obligatoires manquants ou invalides ('body' requis, 'lang' doit être 'FR' ou 'RN')" })
    }

    try {
      // Récupération de la réservation
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { listing: true }
      })

      if (!booking) {
        return reply.status(404).send({ error: 'Réservation non trouvée' })
      }

      // Vérifie que le demandeur est le voyageur ou l'hôte
      const isGuest = booking.guestId === userId
      const isHost = booking.listing.ownerId === userId

      if (!isGuest && !isHost) {
        return reply.status(403).send({ error: 'Interdit - Vous ne faites pas partie de cette réservation' })
      }

      // Détermine la langue cible de la traduction
      const targetLang = lang === 'FR' ? 'RN' : 'FR'

      // Traduction automatique à la volée
      const translatedBody = await translateMessage(body, targetLang)

      // Création du message en base
      const message = await prisma.message.create({
        data: {
          bookingId,
          senderId: userId,
          bodyOriginal: body,
          bodyTranslated: translatedBody,
          lang
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true }
          }
        }
      })

      // Déterminer le destinataire
      const recipientId = isGuest ? booking.listing.ownerId : booking.guestId
      const recipient = await prisma.user.findUnique({ where: { id: recipientId } })

      // Simuler l'envoi d'une notification WhatsApp de rappel (si non lu après 30 minutes)
      console.log(`\n==================================================`);
      console.log(`📲 [SIMULATEUR WHATSAPP] Notification push programmée...`);
      console.log(`DESTINATAIRE : ${recipient?.name} (${recipient?.phone || 'Pas de numéro'})`);
      console.log(`MESSAGE : Nouveau message de ${message.sender.name}.`);
      console.log(`CONTENU : "${body.substring(0, 30)}..."`);
      console.log(`👉 Notification envoyée sur WhatsApp si non lu d'ici 30 minutes.`);
      console.log(`==================================================\n`);

      return reply.status(201).send(message)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de l\'envoi du message' })
    }
  })

  // 2. Récupérer l'historique des messages d'une réservation (Trié chronologiquement)
  fastify.get('/api/bookings/:id/messages', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id: bookingId } = request.params as { id: string }
    const userId = (request.user as any).id

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { listing: true }
      })

      if (!booking) {
        return reply.status(404).send({ error: 'Réservation non trouvée' })
      }

      // Vérifie que le demandeur est le voyageur ou l'hôte
      const isGuest = booking.guestId === userId
      const isHost = booking.listing.ownerId === userId
      const isAdmin = (request.user as any).role === 'ADMIN'

      if (!isGuest && !isHost && !isAdmin) {
        return reply.status(403).send({ error: 'Interdit - Accès non autorisé aux messages' })
      }

      // Récupère les messages par ordre chronologique
      const messages = await prisma.message.findMany({
        where: { bookingId },
        include: {
          sender: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      return messages
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la récupération des messages' })
    }
  })
}
