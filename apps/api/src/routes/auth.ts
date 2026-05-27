/// <reference path="../types.d.ts" />
import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { sendSMS } from '../lib/sms'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/otp/send', async (request, reply) => {
    const { phone } = request.body as { phone: string }

    if (!phone) {
      return reply.status(400).send({ error: 'Numéro de téléphone requis' })
    }

    const cleanPhone = phone.trim()

    // Génère un OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // Expiration dans 5 minutes

    try {
      // Recherche de l'utilisateur par son téléphone
      let user = await prisma.user.findFirst({
        where: { phone: cleanPhone }
      })

      if (!user) {
        // Auto-inscription : crée un utilisateur avec un email et un mot de passe temporaires
        const placeholderEmail = `${cleanPhone.replace(/[\+\s]/g, '')}@inzuconnect.local`
        const placeholderPassword = await bcrypt.hash(Math.random().toString(36), 10)
        
        user = await prisma.user.create({
          data: {
            phone: cleanPhone,
            email: placeholderEmail,
            name: `Voyageur ${cleanPhone}`,
            password: placeholderPassword,
            role: 'GUEST',
            phoneVerified: false,
            otpCode,
            otpExpiresAt
          }
        })
      } else {
        // Met à jour l'utilisateur existant avec le nouvel OTP
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            otpCode,
            otpExpiresAt
          }
        })
      }

      // Envoi du SMS contenant le code d'activation
      const smsSent = await sendSMS(cleanPhone, `Votre code de validation InzuConnect est : ${otpCode}`)
      
      if (!smsSent) {
        return reply.status(500).send({ error: "Échec de l'envoi du SMS de validation" })
      }

      return { success: true, message: 'OTP envoyé avec succès' }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la génération du code de validation' })
    }
  })

  fastify.post('/api/auth/otp/verify', async (request, reply) => {
    const { phone, code } = request.body as { phone: string, code: string }

    if (!phone || !code) {
      return reply.status(400).send({ error: 'Téléphone et code requis' })
    }

    const cleanPhone = phone.trim()

    try {
      const user = await prisma.user.findFirst({
        where: { phone: cleanPhone }
      })

      if (!user) {
        return reply.status(404).send({ error: 'Utilisateur introuvable' })
      }

      if (!user.otpCode || user.otpCode !== code) {
        return reply.status(400).send({ error: 'Code de validation incorrect' })
      }

      if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
        return reply.status(400).send({ error: 'Code de validation expiré' })
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          otpCode: null,
          otpExpiresAt: null
        }
      })

      // Génération des tokens JWT
      const accessToken = fastify.jwt.sign(
        { id: updatedUser.id, role: updatedUser.role },
        { expiresIn: '15m' }
      )
      const refreshToken = fastify.jwt.sign(
        { id: updatedUser.id },
        { expiresIn: '7d' }
      )

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          kycStatus: updatedUser.kycStatus,
          badge: updatedUser.badge
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la validation du code' })
    }
  })
}
