import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { sendSMS } from '../lib/sms'

const prisma = new PrismaClient()

export async function ussdRoutes(fastify: FastifyInstance) {
  
  // Ajouter le parser de contenu pour application/x-www-form-urlencoded sans dépendance tierce
  fastify.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (req, body, done) => {
    try {
      const bodyStr = typeof body === 'string' ? body : (body as any).toString('utf-8')
      const parsed = Object.fromEntries(new URLSearchParams(bodyStr))
      done(null, parsed)
    } catch (err: any) {
      done(err, undefined)
    }
  })

  // Webhook USSD pour Africa's Talking
  fastify.post('/api/ussd', async (request, reply) => {
    // Les paramètres envoyés par Africa's Talking
    const { sessionId, serviceCode, phoneNumber, text } = request.body as {
      sessionId?: string
      serviceCode?: string
      phoneNumber?: string
      text?: string
    }

    if (!phoneNumber) {
      reply.type('text/plain')
      return reply.send('END Paramètre phoneNumber manquant.')
    }

    const inputChain = text ? text.trim() : ''
    const steps = inputChain === '' ? [] : inputChain.split('*')
    
    let responseText = ''

    try {
      if (steps.length === 0) {
        // 1. Menu d'accueil
        responseText = 'CON Bienvenue sur InzuConnect !\n1. Rechercher un logement\n2. Mon profil'
      } else if (steps[0] === '1') {
        // 2. Flux de recherche de logement
        if (steps.length === 1) {
          // Demander la ville
          responseText = 'CON Dans quelle ville cherchez-vous ?\nEntrez le nom (ex: Bujumbura, Gitega, Ngozi) :'
        } else if (steps.length === 2) {
          // Demander le budget
          const city = steps[1].trim()
          responseText = `CON Ville : ${city}\nEntrez votre budget maximum par nuit (FBu) :`
        } else if (steps.length === 3) {
          // Exécuter la recherche
          const city = steps[1].trim()
          const budget = parseInt(steps[2].trim(), 10)

          if (isNaN(budget) || budget <= 0) {
            responseText = 'END Budget invalide. Veuillez recommencer.'
          } else {
            // Rechercher les listings correspondants en base de données
            const listings = await prisma.listing.findMany({
              where: {
                city: {
                  contains: city,
                  mode: 'insensitive'
                },
                price: {
                  lte: budget
                }
              },
              take: 3
            })

            if (listings.length > 0) {
              // Formater le SMS de résultats
              let smsText = `InzuConnect - Logements trouvés à ${city} (Budget max: ${budget} FBu) :\n`
              listings.forEach((l, idx) => {
                smsText += `\n${idx + 1}. ${l.title}\nPrix: ${l.price.toLocaleString()} FBu/nuit\nDistance taxi-moto: ${l.taxiMotoDistance || 'non spécifié'} min\n`
              })
              smsText += '\nRéservez vite sur inzuconnect.com !'

              // Envoyer le SMS
              await sendSMS(phoneNumber, smsText)

              responseText = `END InzuConnect :\n${listings.length} logement(s) trouvé(s) à ${city} !\nLes détails viennent de vous être envoyés par SMS.`
            } else {
              responseText = `END InzuConnect :\nAucun logement ne correspond à votre recherche à ${city} avec un budget de ${budget.toLocaleString()} FBu.`
            }
          }
        } else {
          responseText = 'END Option invalide.'
        }
      } else if (steps[0] === '2') {
        // 3. Flux Profil Utilisateur
        const user = await prisma.user.findFirst({
          where: {
            phone: phoneNumber
          }
        })

        if (user) {
          responseText = `END Profil InzuConnect :\nNom : ${user.name}\nStatut KYC : ${user.kycStatus}\nBadge confiance : ${user.badge}`
        } else {
          responseText = `END Aucun compte InzuConnect trouvé pour le numéro : ${phoneNumber}.\nVeuillez créer votre compte sur l'application.`
        }
      } else {
        responseText = 'END Choix invalide. Veuillez réessayer.'
      }

      // Retourner en texte brut (requis par Africa's Talking)
      reply.type('text/plain')
      return reply.send(responseText)
    } catch (error) {
      fastify.log.error(error)
      reply.type('text/plain')
      return reply.send('END Une erreur interne est survenue sur le serveur USSD.')
    }
  })
}
