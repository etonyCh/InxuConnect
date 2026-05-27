import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { initiateMobileMoneyPayment } from '../lib/intouch'
import { sendSMS } from '../lib/sms'

const prisma = new PrismaClient()

export async function bookingRoutes(fastify: FastifyInstance) {
  
  // 1. Créer une nouvelle réservation avec paiement Mobile Money initié
  fastify.post('/api/bookings', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { listingId, checkIn, checkOut, totalPrice, paymentMethod, phone, serviceItemIds } = request.body as {
      listingId: string
      checkIn: string
      checkOut: string
      totalPrice: number
      paymentMethod: 'ECOCASH' | 'LUMICASH'
      phone: string
      serviceItemIds?: string[]
    }
    const guestId = (request.user as any).id

    if (!listingId || !checkIn || !checkOut || !totalPrice || !paymentMethod || !phone) {
      return reply.status(400).send({ error: 'Champs obligatoires manquants (listingId, checkIn, checkOut, totalPrice, paymentMethod, phone)' })
    }

    try {
      // 1. Récupérer les informations du logement
      const listing = await prisma.listing.findUnique({
        where: { id: listingId }
      })
      if (!listing) {
        return reply.status(404).send({ error: "Logement introuvable." })
      }

      // 2. Vérifier si l'utilisateur fait partie d'une entreprise B2B et appliquer la politique de voyage
      const guestUser = await prisma.user.findUnique({
        where: { id: guestId },
        include: { b2bCompany: true }
      })

      let userCompanyId = null
      if (guestUser && guestUser.b2bCompany) {
        userCompanyId = guestUser.b2bCompanyId
        
        // Validation politique de voyage
        if (listing.price > guestUser.b2bCompany.maxPricePerNight) {
          return reply.status(400).send({
            error: `Politique de voyage enfreinte : Le prix de ce logement (${listing.price.toLocaleString()} BIF/nuit) dépasse la limite autorisée par votre entreprise (${guestUser.b2bCompany.maxPricePerNight.toLocaleString()} BIF/nuit).`
          })
        }
      }

      const serviceBookingsData = serviceItemIds && serviceItemIds.length > 0
        ? {
            create: serviceItemIds.map((id: string) => ({
              serviceItemId: id,
              status: 'PENDING'
            }))
          }
        : undefined

      // Création de la réservation au statut PENDING
      const booking = await prisma.booking.create({
        data: {
          listingId,
          guestId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          totalPrice: Number(totalPrice),
          status: 'PENDING',
          services: serviceBookingsData,
          b2bCompanyId: userCompanyId
        },
        include: {
          services: {
            include: {
              serviceItem: true
            }
          }
        }
      })

      // Déclenchement de la demande de collecte Mobile Money via l'agrégateur InTouch
      const paymentResult = await initiateMobileMoneyPayment({
        phone: phone.trim(),
        amount: Number(totalPrice),
        method: paymentMethod,
        bookingId: booking.id
      })

      // Création de l'enregistrement de paiement associé
      const payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: paymentMethod,
          reference: paymentResult.reference,
          amount: Number(totalPrice),
          status: paymentResult.success ? 'PENDING' : 'FAILED'
        }
      })

      return reply.status(201).send({
        ...booking,
        payment
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la création de la réservation' })
    }
  })

  // 2. Liste des réservations d'un voyageur (avec détails paiements)
  fastify.get('/api/bookings/user/:userId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { userId } = request.params as { userId: string }
    const loggedInUserId = (request.user as any).id

    if (loggedInUserId !== userId && (request.user as any).role !== 'ADMIN') {
      return reply.status(403).send({ error: "Interdit - Vous n'êtes pas autorisé à accéder aux réservations de cet utilisateur" })
    }

    const bookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: { 
        listing: {
          include: { photos: true }
        }, 
        payment: true 
      },
      orderBy: { createdAt: 'desc' }
    })
    return bookings
  })

  // 3. Détail d'une réservation (Guest ou Hôte)
  fastify.get('/api/bookings/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = (request.user as any).id

    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { 
          listing: true, 
          payment: true,
          guest: {
            select: { id: true, name: true, phone: true }
          },
          services: {
            include: {
              serviceItem: true
            }
          }
        }
      })

      if (!booking) {
        return reply.status(404).send({ error: 'Réservation non trouvée' })
      }

      // Vérifie que le demandeur est le voyageur, l'hôte ou un administrateur
      const isGuest = booking.guestId === userId
      const isHost = booking.listing.ownerId === userId
      const isAdmin = (request.user as any).role === 'ADMIN'

      if (!isGuest && !isHost && !isAdmin) {
        return reply.status(403).send({ error: 'Accès interdit à cette réservation' })
      }

      return booking
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la récupération des détails' })
    }
  })

  // 4. Webhook Mock InTouch : Confirmation de paiement reçu (Escrow activé)
  fastify.post('/api/payments/mock-callback', async (request, reply) => {
    const { reference, status } = request.body as { reference: string, status: 'SUCCESS' | 'FAILED' }

    if (!reference || !status) {
      return reply.status(400).send({ error: 'reference et status sont requis' })
    }

    try {
      const payment = await prisma.payment.findUnique({
        where: { reference }
      })

      if (!payment) {
        return reply.status(404).send({ error: 'Paiement introuvable pour cette référence' })
      }

      if (status === 'SUCCESS') {
        // Le paiement a réussi -> Les fonds entrent en Escrow et la réservation est CONFIRMÉE
        await prisma.$transaction([
          prisma.payment.update({
            where: { reference },
            data: { status: 'ESCROWED' }
          }),
          prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED' }
          })
        ])
        console.log(`[ESCROW ACTIVÉ] Réservation ${payment.bookingId} confirmée. Fonds sécurisés en Escrow.`);
      } else {
        await prisma.$transaction([
          prisma.payment.update({
            where: { reference },
            data: { status: 'FAILED' }
          }),
          prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CANCELLED' }
          })
        ])
        console.log(`[PAIEMENT ÉCHOUÉ] Réservation ${payment.bookingId} annulée suite à échec de collecte.`);
      }

      return { success: true, message: 'Statut mis à jour' }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur serveur lors de la mise à jour du paiement' })
    }
  })

  // 5. Validation Check-in & Libération de l'Escrow (Payout) via QR Code Scan
  fastify.post('/api/bookings/:id/check-in', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = (request.user as any).id

    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          listing: {
            include: {
              owner: true
            }
          },
          payment: true
        }
      })

      if (!booking) {
        return reply.status(404).send({ error: 'Réservation non trouvée' })
      }

      // Seul l'hôte propriétaire du logement (ou admin) peut valider le check-in
      if (booking.listing.ownerId !== userId && (request.user as any).role !== 'ADMIN') {
        return reply.status(403).send({ error: "Non autorisé. Seul l'hôte propriétaire de ce logement peut valider l'arrivée." })
      }

      // La réservation doit être CONFIRMED (avec paiement ESCROWED) pour pouvoir valider le check-in
      if (booking.status !== 'CONFIRMED') {
        return reply.status(400).send({ error: `Statut de réservation invalide pour le check-in: ${booking.status} (attendu: CONFIRMED)` })
      }

      const owner = booking.listing.owner
      const agentId = owner.referredByAgentId
      const agentCommissionAmount = agentId ? Math.floor(booking.totalPrice * 0.05) : 0

      // Calcul de la micro-épargne (10% de la part de l'hôte)
      let savingsAmount = 0
      if (owner.microSavingsEnabled) {
        const ownerShare = booking.totalPrice - agentCommissionAmount
        savingsAmount = Math.floor(ownerShare * 0.10)
      }

      // Opérations de transaction
      const transactionOps: any[] = [
        prisma.booking.update({
          where: { id },
          data: { status: 'CHECKED_IN' },
          include: { payment: true }
        }),
        prisma.payment.update({
          where: { bookingId: id },
          data: {
            status: 'PAID_OUT',
            payoutAt: new Date()
          }
        }),
        prisma.serviceBooking.updateMany({
          where: { bookingId: id },
          data: { status: 'CONFIRMED' }
        })
      ]

      if (agentId && agentCommissionAmount > 0) {
        transactionOps.push(
          prisma.agentCommission.create({
            data: {
              agentId,
              bookingId: id,
              amount: agentCommissionAmount
            }
          })
        )
        console.log(`[COMMISSION AGENT PRÉPARÉE] 5% (${agentCommissionAmount} BIF) seront reversés à l'agent ${agentId} pour parrainage.`);
      }

      if (savingsAmount > 0) {
        transactionOps.push(
          prisma.user.update({
            where: { id: owner.id },
            data: {
              savingsBalance: {
                increment: savingsAmount
              }
            }
          })
        )
        console.log(`[MICRO-ÉPARGNE ACTIVÉE] 10% (${savingsAmount} BIF) retenus pour le compte d'épargne de l'hôte.`);
      }

      // Libération des fonds (Escrow -> Paid Out), validation check-in, et commission agent
      const updated = await prisma.$transaction(transactionOps)

      console.log(`[ESCROW LIBÉRÉ - PAYOUT] Check-in validé pour réservation ${id}. Fonds reversés à l'hôte ${userId}.`);
      if (agentId && agentCommissionAmount > 0) {
        console.log(`[COMMISSION TRANSFÉRÉE] ${agentCommissionAmount} BIF crédités sur le compte de l'agent ${agentId}.`);
      }
      if (savingsAmount > 0) {
        console.log(`[MICRO-ÉPARGNE TRANSFÉRÉE] ${savingsAmount} BIF ajoutés au solde d'épargne.`);
      }

      return {
        success: true,
        message: 'Check-in validé et reversement des fonds hôte effectué',
        booking: updated[0]
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la validation du check-in' })
    }
  })

  // 6. SOS Alerte d'urgence (SMS à l'autre partie + Coordonnées GPS)
  fastify.post('/api/bookings/:id/sos', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { latitude, longitude } = request.body as { latitude?: number; longitude?: number }
    const userId = (request.user as any).id

    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          listing: {
            include: {
              owner: true
            }
          },
          guest: true
        }
      })

      if (!booking) {
        return reply.status(404).send({ error: 'Réservation non trouvée.' })
      }

      // Le SOS ne peut être déclenché que pour les séjours en cours (CHECKED_IN)
      if (booking.status !== 'CHECKED_IN') {
        return reply.status(400).send({
          error: `Vous ne pouvez pas déclencher d'alerte SOS pour une réservation au statut : ${booking.status}. Le séjour doit être actif (CHECKED_IN).`
        })
      }

      const isGuest = booking.guestId === userId
      const isHost = booking.listing.ownerId === userId

      if (!isGuest && !isHost) {
        return reply.status(403).send({ error: "Vous n'êtes pas autorisé à déclencher un SOS pour cette réservation." })
      }

      // Déterminer l'expéditeur et le destinataire
      const senderName = isGuest ? booking.guest.name : booking.listing.owner.name
      const receiverPhone = isGuest ? booking.listing.owner.phone : booking.guest.phone
      const roleLabel = isGuest ? 'le voyageur' : "l'hôte"

      if (!receiverPhone) {
        return reply.status(400).send({ error: 'Le numéro de téléphone du destinataire est manquant.' })
      }

      // Composer le message d'urgence
      let gpsDetails = ''
      if (latitude !== undefined && longitude !== undefined) {
        gpsDetails = `\nPosition GPS actuelle : https://www.google.com/maps?q=${latitude},${longitude}`
      }

      const message = `🚨 [INZUCONNECT - SOS URGENCE] 🚨\nUne alerte de sécurité a été déclenchée par ${senderName} (${roleLabel}) pour la réservation du logement "${booking.listing.title}" (Réf: #${booking.id.substring(0, 8)}).${gpsDetails}\nVeuillez le contacter immédiatement ou alerter les secours localement.`

      // Envoi du SMS d'urgence
      const success = await sendSMS(receiverPhone, message)

      if (success) {
        console.log(`[SOS URGENT ENVOYÉ] Alerte déclenchée par ${senderName}. SMS d'alerte envoyé au destinataire ${receiverPhone}.`)
        return { success: true, message: 'Alerte SOS transmise avec succès aux services et à l\'autre participant.' }
      } else {
        return reply.status(500).send({ error: "Échec de l'envoi du SMS d'alerte d'urgence." })
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors du déclenchement du SOS.' })
    }
  })
}
