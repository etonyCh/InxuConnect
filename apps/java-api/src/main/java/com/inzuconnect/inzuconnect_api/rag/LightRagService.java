package com.inzuconnect.inzuconnect_api.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inzuconnect.inzuconnect_api.domain.Listing;
import com.inzuconnect.inzuconnect_api.repository.ListingRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class LightRagService {

    private final InMemoryVectorStore vectorStore;
    private final SimpleTextChunker chunker;
    private final EmbeddingClient embeddingClient;
    private final ListingRepository listingRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String anthropicApiKey;

    public LightRagService(InMemoryVectorStore vectorStore,
                           SimpleTextChunker chunker,
                           EmbeddingClient embeddingClient,
                           ListingRepository listingRepository,
                           ObjectMapper objectMapper) {
        this.vectorStore = vectorStore;
        this.chunker = chunker;
        this.embeddingClient = embeddingClient;
        this.listingRepository = listingRepository;
        this.objectMapper = objectMapper.copy();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        String k = System.getenv("ANTHROPIC_API_KEY");
        this.anthropicApiKey = (k != null && !k.isBlank() && !k.startsWith("YOUR_")) ? k : null;
    }

    public record IndexResult(int indexedChunks, int sourceItems, String note) {}

    public record RetrievedChunk(String id, String text, double score, Map<String, String> metadata) {}

    public record RagAnswer(String answer, List<RetrievedChunk> sources, boolean usedLlm, String model) {}

    public IndexResult indexAllPublishedListings() {
        List<Listing> listings = listingRepository.findAll().stream()
                .filter(l -> Boolean.TRUE.equals(l.isListingPublished()))
                .toList();
        if (listings.isEmpty()) {
            return new IndexResult(0, 0, "Aucune annonce publiée trouvée");
        }

        int totalChunks = 0;
        for (Listing l : listings) {
            totalChunks += indexListing(l);
        }
        return new IndexResult(totalChunks, listings.size(), "OK");
    }

    public int indexListing(Listing l) {
        String doc = buildListingDocument(l);
        Map<String, String> meta = new LinkedHashMap<>();
        meta.put("kind", "listing");
        meta.put("listingId", l.getId());
        meta.put("city", l.getCity());
        meta.put("price", String.valueOf(l.getPrice()));
        meta.put("bedrooms", String.valueOf(l.getBedrooms()));
        meta.put("bathrooms", String.valueOf(l.getBathrooms()));
        meta.put("title", l.getTitle());

        List<String> chunks = chunker.chunk(doc, 600, 100);
        int count = 0;
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            EmbeddingClient.EmbeddingResult emb = embeddingClient.embed(chunk);
            String id = "lst:" + l.getId() + "#" + i;
            Map<String, String> chunkMeta = new LinkedHashMap<>(meta);
            chunkMeta.put("chunkIndex", String.valueOf(i));
            chunkMeta.put("embeddingModel", emb.model());
            chunkMeta.put("embeddingFallback", String.valueOf(emb.usedFallback()));
            vectorStore.upsert(id, chunk, emb.vector(), chunkMeta);
            count++;
        }
        return count;
    }

    public IndexResult indexKnowledgeBase() {
        Map<String, Map<String, String>> kb = defaultKnowledgeBase();
        int total = 0;
        for (var entry : kb.entrySet()) {
            String doc = entry.getKey();
            Map<String, String> meta = entry.getValue();
            List<String> chunks = chunker.chunk(doc, 500, 70);
            for (int i = 0; i < chunks.size(); i++) {
                String chunk = chunks.get(i);
                EmbeddingClient.EmbeddingResult emb = embeddingClient.embed(chunk);
                String id = "kb:" + Math.abs((doc + i).hashCode()) + "#" + i;
                Map<String, String> chunkMeta = new LinkedHashMap<>(meta);
                chunkMeta.put("kind", "kb");
                chunkMeta.put("chunkIndex", String.valueOf(i));
                chunkMeta.put("embeddingModel", emb.model());
                chunkMeta.put("embeddingFallback", String.valueOf(emb.usedFallback()));
                vectorStore.upsert(id, chunk, emb.vector(), chunkMeta);
                total++;
            }
        }
        return new IndexResult(total, kb.size(), "KB indexed");
    }

    public List<RetrievedChunk> retrieve(String query, int topK) {
        return retrieve(query, topK, Map.of());
    }

    public List<RetrievedChunk> retrieve(String query, int topK, Map<String, String> filter) {
        EmbeddingClient.EmbeddingResult qv = embeddingClient.embed(query);
        List<InMemoryVectorStore.ScoredEntry> results = vectorStore.similaritySearch(qv.vector(), topK, filter);
        List<RetrievedChunk> out = new ArrayList<>(results.size());
        for (var r : results) {
            out.add(new RetrievedChunk(r.entry().id(), r.entry().text(), r.score(), r.entry().metadata()));
        }
        return out;
    }

    public RagAnswer answerWithRag(String question, int topK) {
        List<RetrievedChunk> ctx = retrieve(question, topK);
        if (ctx.isEmpty()) {
            return new RagAnswer(
                    "Je n'ai pas trouvé de contexte pertinent dans la base de connaissances. " +
                    "Essayez de reformuler votre question ou d'indexer d'abord les annonces (`/api/ai/rag/index`).",
                    List.of(),
                    false,
                    "template-fallback"
            );
        }

        if (anthropicApiKey == null) {
            return new RagAnswer(buildTemplateAnswer(question, ctx), ctx, false, "template-fallback");
        }

        try {
            String answer = callClaudeForAnswer(question, ctx);
            return new RagAnswer(answer, ctx, true, "claude-3-5-sonnet");
        } catch (Exception e) {
            return new RagAnswer(buildTemplateAnswer(question, ctx), ctx, false, "template-fallback");
        }
    }

    public int storeSize() {
        return vectorStore.size();
    }

    public void clearStore() {
        vectorStore.clear();
    }

    private String buildListingDocument(Listing l) {
        StringBuilder sb = new StringBuilder();
        sb.append("Annonce InzuConnect : ").append(l.getTitle()).append("\n");
        sb.append("Ville : ").append(l.getCity()).append(" | Pays : ").append(l.getCountry()).append("\n");
        sb.append("Prix : ").append(l.getPrice()).append(" ").append(l.getCurrency()).append("\n");
        sb.append("Chambres : ").append(l.getBedrooms()).append(" | Salles de bain : ").append(l.getBathrooms()).append("\n");
        if (l.getPropertyType() != null) sb.append("Type de bien : ").append(l.getPropertyType()).append("\n");
        if (l.getSquareMeters() != null) sb.append("Surface : ").append(l.getSquareMeters()).append(" m²\n");
        if (l.getAddress() != null) sb.append("Adresse : ").append(l.getAddress()).append("\n");
        if (l.getFloor() != null) sb.append("Étage : ").append(l.getFloor()).append("\n");
        if (l.getAmenities() != null && !l.getAmenities().isEmpty()) {
            sb.append("Équipements : ");
            List<String> ams = l.getAmenities().stream()
                    .map(a -> a.getName() == null ? String.valueOf(a.getId()) : a.getName())
                    .toList();
            sb.append(String.join(", ", ams)).append("\n");
        }
        if (l.isInstantBookEnabled()) sb.append("Réservation instantanée : Oui\n");
        sb.append("Séjour min : ").append(l.getMinStayNights()).append(" nuit(s)\n");
        sb.append("Frais ménage : ").append(l.getCleaningFee()).append(" ").append(l.getCurrency()).append("\n");
        sb.append("Animaux autorisés : ").append(l.isAllowPets() ? "Oui" : "Non").append("\n");
        sb.append("\nDescription : ").append(l.getDescription());
        if (l.getCustomRules() != null && !l.getCustomRules().isBlank()) {
            sb.append("\n\nRègles spécifiques : ").append(l.getCustomRules());
        }
        return sb.toString();
    }

    private LinkedHashMap<String, Map<String, String>> defaultKnowledgeBase() {
        LinkedHashMap<String, Map<String, String>> kb = new LinkedHashMap<>();
        Map<String, String> m1 = new LinkedHashMap<>();
        m1.put("topic", "frais-service");
        kb.put("InzuConnect — Frais et commissions. Les hôtes et agents paient une commission de service de 8%% sur chaque réservation confirmée. " +
                "Des frais de ménage (cleaningFee) sont perçus par l'hôte et remis en totalité à celui-ci. Une remise hebdomadaire (weeklyDiscountPercent) " +
                "et mensuelle (monthlyDiscountPercent) peut être configurée par l'hôte.", m1);

        Map<String, String> m2 = new LinkedHashMap<>();
        m2.put("topic", "reservation");
        kb.put("InzuConnect — Réservations. Une réservation nécessite au minimum 24h de préavis (advanceNoticeHours). " +
                "Le séjour minimum est de 1 nuit et le maximum de 90 nuits par défaut. La réservation instantanée (instantBookEnabled) peut " +
                "être activée par l'hôte pour éviter toute validation manuelle. Une pièce d'identité du voyageur est exigée par défaut.", m2);

        Map<String, String> m3 = new LinkedHashMap<>();
        m3.put("topic", "annulation");
        kb.put("InzuConnect — Politique d'annulation. L'annulation est gratuite jusqu'à 48h avant l'arrivée. Passé ce délai, 50%% du montant " +
                "est retenu. Toute annulation le jour même ou non-présentation (no-show) entraîne la perception de 100%% du séjour.", m3);

        Map<String, String> m4 = new LinkedHashMap<>();
        m4.put("topic", "villes-couvertes");
        kb.put("InzuConnect — Couverture géographique (Burundi). Les trois villes principales couvertes sont : Bujumbura (économique, lac Tanganyika), " +
                "Gitega (capitale politique), et Ngozi (nord du pays). Les prix moyens y sont respectivement ~40k, ~30k et ~25k BIF par nuit.", m4);

        Map<String, String> m5 = new LinkedHashMap<>();
        m5.put("topic", "equipements-premium");
        kb.put("InzuConnect — Équipements premium. Un groupe électrogène (générateur / surchargeGenerator) compense les coupures de courant fréquentes. " +
                "Une citerne d'eau (water tank) garantit la disponibilité en eau potable. Starlink fournit un internet satellite haut débit fiable. " +
                "Un gardien de sécurité (security guard) et une cuisine équipée sont également considérés comme des différentiateurs premium.", m5);

        Map<String, String> m6 = new LinkedHashMap<>();
        m6.put("topic", "paiement");
        kb.put("InzuConnect — Modes de paiement. Les paiements s'effectuent en francs burundais (BIF). Les méthodes supportées incluent " +
                "Mobile Money (EcoCash, Lumicash, M-Pesa au Burundi), virement bancaire, et cartes bancaires via Stripe. " +
                "Le dépôt de garantie correspond à 30%% du montant total et est restitué 48h après le check-out si aucun dommage n'est constaté.", m6);

        return kb;
    }

    private String callClaudeForAnswer(String question, List<RetrievedChunk> sources) throws Exception {
        StringBuilder ctx = new StringBuilder();
        for (int i = 0; i < sources.size(); i++) {
            RetrievedChunk c = sources.get(i);
            ctx.append("--- Source #").append(i + 1).append(" ---\n");
            if (c.metadata() != null) {
                String kind = c.metadata().get("kind");
                if ("listing".equals(kind)) {
                    ctx.append("Type: Annonce | Titre: ").append(c.metadata().getOrDefault("title", ""))
                       .append(" | Ville: ").append(c.metadata().getOrDefault("city", ""))
                       .append(" | Prix: ").append(c.metadata().getOrDefault("price", ""))
                       .append(" BIF\n");
                } else if ("kb".equals(kind)) {
                    ctx.append("Type: Base de connaissances | Sujet: ")
                       .append(c.metadata().getOrDefault("topic", "general")).append("\n");
                }
            }
            ctx.append("Contenu: ").append(c.text()).append("\n\n");
        }

        String system = "Tu es l'assistant RAG léger d'InzuConnect, la plateforme immobilière du Burundi.\n" +
                "Règles strictes :\n" +
                "1. Réponds UNIQUEMENT à partir du CONTEXTE fourni ci-dessous. Si l'information n'y est PAS, dis-le clairement et n'invente rien.\n" +
                "2. Cite tes sources discrètement (#1, #2, ...) entre parenthèses à la fin des affirmations qui s'y réfèrent.\n" +
                "3. Parle en français simple et professionnel. Longueur max ~250 mots.\n" +
                "4. Si la question concerne un prix / logement concret, rappelle la devise BIF (franc burundais).\n";

        String user = "CONTEXTE :\n" + ctx + "\n\nQUESTION UTILISATEUR : " + question;

        Map<String, Object> body = Map.of(
                "model", "claude-3-5-sonnet-20241022",
                "max_tokens", 600,
                "temperature", 0.2,
                "system", system,
                "messages", List.of(Map.of("role", "user", "content", user))
        );

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/messages"))
                .header("x-api-key", anthropicApiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) throw new RuntimeException("Claude " + res.statusCode());
        JsonNode root = objectMapper.readTree(res.body());
        return root.path("content").get(0).path("text").asText().trim();
    }

    private String buildTemplateAnswer(String question, List<RetrievedChunk> sources) {
        StringBuilder sb = new StringBuilder();
        sb.append("Voici les éléments les plus pertinents trouvés dans notre base :\n\n");
        for (int i = 0; i < sources.size(); i++) {
            RetrievedChunk c = sources.get(i);
            Map<String, String> m = c.metadata();
            String header = "— Source " + (i + 1);
            if (m != null && "listing".equals(m.get("kind"))) {
                header += " [Annonce: " + m.getOrDefault("title", "?") + " - " + m.getOrDefault("city", "?") + "]";
            } else if (m != null && "kb".equals(m.get("kind"))) {
                header += " [KB: " + m.getOrDefault("topic", "?") + "]";
            }
            header += String.format(" (pertinence %.0f%%)", c.score() * 100);
            sb.append(header).append(" :\n");
            String txt = c.text().length() > 400 ? c.text().substring(0, 397) + "..." : c.text();
            sb.append(txt).append("\n\n");
        }
        sb.append("(Configurer ANTHROPIC_API_KEY pour obtenir une réponse générée en langage naturel.)");
        return sb.toString();
    }
}
