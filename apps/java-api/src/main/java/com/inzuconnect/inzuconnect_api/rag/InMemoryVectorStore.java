package com.inzuconnect.inzuconnect_api.rag;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryVectorStore {

    private final Map<String, VectorEntry> store = new ConcurrentHashMap<>();

    public record VectorEntry(
            String id,
            String text,
            float[] vector,
            Map<String, String> metadata
    ) {}

    public record ScoredEntry(VectorEntry entry, double score) {}

    public void upsert(String id, String text, float[] vector, Map<String, String> metadata) {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(vector, "vector");
        store.put(id, new VectorEntry(id, text, vector, metadata == null ? Map.of() : Map.copyOf(metadata)));
    }

    public void remove(String id) {
        store.remove(id);
    }

    public Optional<VectorEntry> get(String id) {
        return Optional.ofNullable(store.get(id));
    }

    public int size() {
        return store.size();
    }

    public void clear() {
        store.clear();
    }

    public List<ScoredEntry> similaritySearch(float[] queryVector, int topK) {
        return similaritySearch(queryVector, topK, Map.of());
    }

    public List<ScoredEntry> similaritySearch(float[] queryVector, int topK, Map<String, String> filterMetadata) {
        Objects.requireNonNull(queryVector, "queryVector");
        if (topK <= 0) return List.of();

        PriorityQueue<ScoredEntry> heap = new PriorityQueue<>(
                topK + 1,
                Comparator.comparingDouble(ScoredEntry::score)
        );

        double queryNorm = norm(queryVector);
        if (queryNorm == 0.0) return List.of();

        for (VectorEntry e : store.values()) {
            if (!matchesFilter(e.metadata(), filterMetadata)) continue;
            double sim = cosineSimilarity(queryVector, e.vector(), queryNorm);
            if (heap.size() < topK) {
                heap.add(new ScoredEntry(e, sim));
            } else if (sim > heap.peek().score()) {
                heap.poll();
                heap.add(new ScoredEntry(e, sim));
            }
        }

        List<ScoredEntry> out = new ArrayList<>(heap.size());
        while (!heap.isEmpty()) out.add(heap.poll());
        Collections.reverse(out);
        return out;
    }

    private boolean matchesFilter(Map<String, String> entryMeta, Map<String, String> filter) {
        if (filter == null || filter.isEmpty()) return true;
        for (Map.Entry<String, String> f : filter.entrySet()) {
            String v = entryMeta.get(f.getKey());
            if (!f.getValue().equals(v)) return false;
        }
        return true;
    }

    static double cosineSimilarity(float[] a, float[] b, double normA) {
        if (a.length != b.length) {
            int min = Math.min(a.length, b.length);
            double dot = 0.0;
            double normB = 0.0;
            for (int i = 0; i < min; i++) {
                dot += (double) a[i] * b[i];
                normB += (double) b[i] * b[i];
            }
            normB = Math.sqrt(normB);
            if (normB == 0.0) return 0.0;
            return dot / (normA * normB);
        }
        double dot = 0.0;
        double normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += (double) a[i] * b[i];
            normB += (double) b[i] * b[i];
        }
        normB = Math.sqrt(normB);
        if (normB == 0.0) return 0.0;
        return dot / (normA * normB);
    }

    private static double norm(float[] v) {
        double s = 0.0;
        for (float f : v) s += (double) f * f;
        return Math.sqrt(s);
    }
}
