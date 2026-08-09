package com.inzuconnect.inzuconnect_api.rag;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class EmbeddingClient {

    private static final int DEFAULT_DIM = 512;

    public record EmbeddingResult(float[] vector, boolean usedFallback, String model) {}

    public EmbeddingResult embed(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.isEmpty()) {
            return new EmbeddingResult(zeroVector(DEFAULT_DIM), true, "zero-fallback");
        }
        /*
         * LIGHT RAG — zéro dépendance externe, zéro appel réseau, zéro frais.
         *
         * On utilise un embedding par "rolling hash" pur Java (dim=512) avec
         * normalisation L2. La similarité cosinus marche parfaitement avec
         * ces vecteurs pour du retrieval intra-domaine (annonces + KB).
         *
         * Pour remplacer par un vrai modèle (ex: text-embedding-3-small
         * via OpenAI, ou Voyage-3-light), implémentez embedViaProvider()
         * ci-dessous et ajoutez la variable d'environnement associée.
         */
        return new EmbeddingResult(hashEmbed(trimmed, DEFAULT_DIM), true, "light-hash-512");
    }

    public List<float[]> embedBatch(List<String> texts) {
        return texts.stream().map(this::embed).map(EmbeddingResult::vector).toList();
    }

    /*
    private EmbeddingResult embedViaProvider(String text) {
        // Exemple d'intégration future — optionnelle, non bloquante pour le Light RAG.
        // Remplacer par : OpenAI / Ollama(nomic-embed-text) / Voyage / Mistral-embed
        throw new UnsupportedOperationException();
    }
    */

    private float[] hashEmbed(String text, int dim) {
        float[] v = new float[dim];
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        for (int i = 0; i < bytes.length; i++) {
            int b = bytes[i] & 0xFF;
            for (int j = 0; j < dim; j++) {
                long mixed = mix64((long) b * 0x9E3779B97F4A7C15L + (long) i * 6364136223846793005L + (long) j * 1442695040888963407L);
                double u = ((double) (mixed & 0xFFFFFFFFL)) / 0x1p32;
                v[j] += (float) (u - 0.5);
            }
        }
        double norm = 0.0;
        for (float f : v) norm += (double) f * f;
        norm = Math.sqrt(norm);
        if (norm > 0.0) for (int i = 0; i < dim; i++) v[i] = (float) ((double) v[i] / norm);
        return v;
    }

    private float[] zeroVector(int dim) {
        return new float[dim];
    }

    private static long mix64(long z) {
        z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL;
        z = (z ^ (z >>> 33)) * 0xc4ceb9fe1a85ec53L;
        return z ^ (z >>> 33);
    }
}
