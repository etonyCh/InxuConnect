import { FastifyInstance } from 'fastify'
import { parseVoiceCommand } from '../lib/voiceAssistant'

export async function voiceRoutes(fastify: FastifyInstance) {
  fastify.post('/api/ai/voice-assistant', async (request, reply) => {
    const { transcript, audio, mockTranscript } = request.body as {
      transcript?: string
      audio?: string // Base64 audio stream
      mockTranscript?: string // Optional parameter to override transcription during mock testing
    }

    let textCommand = transcript || ''

    // Simulation de transcription si un flux audio base64 est envoyé
    if (audio && !transcript) {
      if (mockTranscript) {
        textCommand = mockTranscript
      } else {
        // Décodage de test basé sur des valeurs fictives ou par défaut
        if (audio.startsWith('U291cyAzMDAwMCBGaXRlZ2E=')) { // "Sous 30000 Gitega"
          textCommand = 'Je cherche une chambre i Gitega sous 30000 BIF avec generator'
        } else if (audio.startsWith('NmdvemkgaW56dSBpZmlzZSBtb3Rlcmk=')) { // "Ngozi inzu ifise moteri"
          textCommand = 'Ngozi inzu ifise moteri y\'umuriro'
        } else {
          textCommand = 'Bujumbura pas cher avec Starlink'
        }
      }
      console.log(`[SPEECH-TO-TEXT SIMULATOR] Flux audio décodé en : "${textCommand}"`)
    }

    if (!textCommand || textCommand.trim() === '') {
      return reply.status(400).send({ error: "Aucune transcription textuelle ou flux audio n'a été fourni." })
    }

    try {
      const filters = await parseVoiceCommand(textCommand)
      return reply.send({
        success: true,
        transcript: textCommand,
        filters
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Erreur lors du traitement de la commande vocale.' })
    }
  })
}
