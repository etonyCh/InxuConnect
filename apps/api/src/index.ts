import Fastify from 'fastify';
import cors from '@fastify/cors';
import { prisma } from './lib/prisma.js';

const fastify = Fastify({ logger: true });

// Enregistre CORS (sans await)
fastify.register(cors, { origin: true });

fastify.get('/health', async () => {
  return { status: 'ok', service: 'inzuconnect-api', timestamp: new Date().toISOString() };
});

fastify.get('/api/properties', async () => {
  const properties = await prisma.property.findMany({
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return { data: properties };
});

fastify.get('/api/properties/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const property = await prisma.property.findUnique({
    where: { id },
    include: { owner: { select: { id: true, name: true, email: true } } }
  });
  if (!property) {
    reply.code(404);
    return { error: 'Property not found' };
  }
  return { data: property };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 API running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
