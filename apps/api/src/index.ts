import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import authPlugin from './plugins/auth'
import { listingRoutes } from './routes/listings'
import { bookingRoutes } from './routes/bookings'
import { authRoutes } from './routes/auth'
import { kycRoutes } from './routes/kyc'
import { messageRoutes } from './routes/messages'
import { reviewRoutes } from './routes/reviews'
import { ussdRoutes } from './routes/ussd'
import { agentRoutes } from './routes/agents'
import { serviceRoutes } from './routes/services'
import { priceCoachRoutes } from './routes/priceCoach'
import { voiceRoutes } from './routes/voice'
import { b2bRoutes } from './routes/b2b'
import { savingsRoutes } from './routes/savings'
import { partnerRoutes } from './routes/partners'
import { stagingRoutes } from './routes/staging'

async function start() {
  const fastify = Fastify({ logger: true })
  await fastify.register(cors, { origin: true })
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'inzuconnect-jwt-secret-dev-2026'
  })
  await fastify.register(authPlugin)
  await fastify.register(listingRoutes)
  await fastify.register(bookingRoutes)
  await fastify.register(authRoutes)
  await fastify.register(kycRoutes)
  await fastify.register(messageRoutes)
  await fastify.register(reviewRoutes)
  await fastify.register(ussdRoutes)
  await fastify.register(agentRoutes)
  await fastify.register(serviceRoutes)
  await fastify.register(priceCoachRoutes)
  await fastify.register(voiceRoutes)
  await fastify.register(b2bRoutes)
  await fastify.register(savingsRoutes)
  await fastify.register(partnerRoutes)
  await fastify.register(stagingRoutes)
  
  await fastify.listen({ port: 3001, host: '0.0.0.0' })
  console.log('✅ API running on http://localhost:3001')
}

start()
