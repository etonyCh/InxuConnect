package com.inzuconnect.inzuconnect_api.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class EmbeddingClient {

    private static final String ANTHROPIC_EMBED_MODEL = "claude-3-haiku-20240307";
    private static final int DEFAULT_DIM = 1024;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean anthropicAvailable;
    private final String anthropicApiKey;

    public EmbeddingClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper.copy();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        String key = System.getenv("ANTHROPIC_API_KEY");
        this.anthropicApiKey = key;
        this.anthropicAvailable = key != null && !key.isBlank() && !key.startsWith("YOUR_");
    }

    public record EmbeddingResult(float[] vector, boolean usedFallback, String model) {}

    public EmbeddingResult embed(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.isEmpty()) {
            return new EmbeddingResult(zeroVector(DEFAULT_DIM), true, "zero-fallback");
        }
        if (anthropicAvailable) {
            try {
                return embedViaAnthropic(trimmed);
            } catch (Exception e) {
                return new EmbeddingResult(hashEmbed(trimmed, DEFAULT_DIM), true, "hash-fallback");
            }
        }
        return new EmbeddingResult(hashEmbed(trimmed, DEFAULT_DIM), true, "hash-fallback");
    }

    public List<float[]> embedBatch(List<String> texts) {
        return texts.stream().map(this::embed).map(EmbeddingResult::vector).toList();
    }

    private EmbeddingResult embedViaAnthropic(String text) throws Exception {
        Map<String, Object> body = Map.of(
                "model", ANTHROPIC_EMBED_MODEL,
                "input", List.of(Map.of("type", "text", "text", text.length() > 8000 ? text.substring(0, 8000) : text))
        );

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/embeddings"))
                .header("x-api-key", anthropicApiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .timeout(Duration.ofSeconds(25))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            throw new RuntimeException("Embedding API status " + res.statusCode());
        }

        JsonNode root = objectMapper.readTree(res.body());
        JsonNode embeddingsNode = root.path("embeddings");
        if (embeddingsNode.isArray() && !embeddingsNode.isEmpty()) {
            JsonNode first = embeddingsNode.get(0).path("values");
            int dim = first.size();
            float[] v = new float[dim];
            for (int i = 0; i < dim; i++) v[i] = (float) first.get(i).asDouble();
            return new EmbeddingResult(v, false, ANTHROPIC_EMBED_MODEL);
        }
        throw new RuntimeException("Missing embeddings in response");
    }

    private float[] hashEmbed(String text, int dim) {
        float[] v = new float[dim];
        byte[] bytes = text.getBytes(java.nio.charset.StandardCharsets.UTF_8);
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
