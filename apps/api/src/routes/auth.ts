/// <reference path="../types.d.ts" />
import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { sendSMS } from '../lib/sms'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function authRoutes(fastify: FastifyInstance) {
  
  // A. Inscription classique (Email, Téléphone, Password, Nom, Rôle)
  fastify.post('/api/auth/register', async (request, reply) => {
    const { email, phone, password, name, role } = request.body as {
      email: string
      phone?: string
      password: string
      name: string
      role?: 'GUEST' | 'HOST' | 'AGENT' | 'ADMIN'
    }

    if (!email || !password || !name) {
      return reply.status(400).send({ error: 'Email, mot de passe et nom complet sont requis' })
    }

    try {
      const cleanEmail = email.trim().toLowerCase()
      const cleanPhone = phone ? phone.trim() : null

      // Vérifier l'existence
      const OR: any[] = [{ email: cleanEmail }]
      if (cleanPhone) {
        OR.push({ phone: cleanPhone })
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR }
      })

      if (existingUser) {
        return reply.status(400).send({ error: 'Un utilisateur avec cet email ou ce numéro de téléphone existe déjà' })
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: cleanEmail,
          phone: cleanPhone,
          password: hashedPassword,
          name,
          role: role || 'GUEST',
          phoneVerified: cleanPhone ? true : false
        }
      })

      return reply.status(201).send({
        success: true,
        message: 'Utilisateur créé avec succès',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role
        }
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la création du compte' })
    }
  })

  // B. Connexion classique (Email, Password)
  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email: string, password: string }

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email et mot de passe requis' })
    }

    try {
      const cleanEmail = email.trim().toLowerCase()

      const user = await prisma.user.findUnique({
        where: { email: cleanEmail }
      })

      if (!user) {
        return reply.status(401).send({ error: 'Identifiants invalides (Email non trouvé)' })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return reply.status(401).send({ error: 'Identifiants invalides (Mot de passe incorrect)' })
      }

      // Génération des tokens JWT
      const accessToken = fastify.jwt.sign(
        { id: user.id, role: user.role },
        { expiresIn: '15m' }
      )
      const refreshToken = fastify.jwt.sign(
        { id: user.id },
        { expiresIn: '7d' }
      )

      return {
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          role: user.role,
          kycStatus: user.kycStatus,
          badge: user.badge
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la tentative de connexion' })
    }
  })

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

  // 3. Récupérer le profil (Protégé par token)
  fastify.get('/api/auth/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return reply.status(404).send({ error: 'Utilisateur introuvable' })
      }

      return {
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          role: user.role,
          kycStatus: user.kycStatus,
          badge: user.badge,
          microSavingsEnabled: user.microSavingsEnabled,
          savingsBalance: user.savingsBalance
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la récupération du profil' })
    }
  })

  // 4. Mise à jour du profil (Protégé par token)
  fastify.patch('/api/auth/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).id
    const { name, phone, role, microSavingsEnabled } = request.body as {
      name?: string
      phone?: string
      role?: 'GUEST' | 'HOST' | 'AGENT' | 'ADMIN'
      microSavingsEnabled?: boolean
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name !== undefined ? name : undefined,
          phone: phone !== undefined ? phone : undefined,
          role: role !== undefined ? role : undefined,
          microSavingsEnabled: microSavingsEnabled !== undefined ? microSavingsEnabled : undefined
        }
      })

      return {
        success: true,
        message: 'Profil mis à jour avec succès',
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          kycStatus: updatedUser.kycStatus,
          badge: updatedUser.badge,
          microSavingsEnabled: updatedUser.microSavingsEnabled,
          savingsBalance: updatedUser.savingsBalance
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors de la mise à jour du profil' })
    }
  })
}
