package com.inzuconnect.inzuconnect_api.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @PostMapping("/voice-assistant")
    public ResponseEntity<?> voiceAssistant(@RequestBody Map<String, Object> body) {
        String transcript = (String) body.get("transcript");
        String audio = (String) body.get("audio");
        String mockTranscript = (String) body.get("mockTranscript");

        String textCommand = transcript != null ? transcript : "";

        // Simulation de transcription si un flux audio base64 est envoyé
        if (audio != null && !audio.trim().isEmpty() && textCommand.isEmpty()) {
            if (mockTranscript != null && !mockTranscript.trim().isEmpty()) {
                textCommand = mockTranscript;
            } else {
                if (audio.startsWith("U291cyAzMDAwMCBGaXRlZ2E=")) { // "Sous 30000 Gitega"
                    textCommand = "Je cherche une chambre i Gitega sous 30000 BIF avec generator";
                } else if (audio.startsWith("NmdvemkgaW56dSBpZmlzZSBtb3Rlcmk=")) { // "Ngozi inzu ifise moteri"
                    textCommand = "Ngozi inzu ifise moteri y'umuriro";
                } else {
                    textCommand = "Bujumbura pas cher avec Starlink";
                }
            }
            System.out.println("[SPEECH-TO-TEXT SIMULATOR] Flux audio décodé en : \"" + textCommand + "\"");
        }

        if (textCommand.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Aucune transcription textuelle ou flux audio n'a été fourni."));
        }

        try {
            Map<String, Object> filters = parseVoiceCommand(textCommand);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "transcript", textCommand,
                    "filters", filters
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du traitement de la commande vocale."));
        }
    }

    private Map<String, Object> parseVoiceCommand(String transcript) {
        String apiKey = System.getenv("ANTHROPIC_API_KEY");

        if (apiKey != null && !apiKey.trim().isEmpty() && !apiKey.startsWith("YOUR_")) {
            try {
                return callClaudeForVoiceParsing(apiKey, transcript);
            } catch (Exception e) {
                System.err.println("Erreur lors du décodage vocal par Claude API, utilisation du fallback : " + e.getMessage());
                return parseVoiceCommandFallback(transcript);
            }
        } else {
            return parseVoiceCommandFallback(transcript);
        }
    }

    private Map<String, Object> callClaudeForVoiceParsing(String apiKey, String transcript) throws Exception {
        String prompt = "Vous êtes l'assistant vocal NLP de la plateforme InzuConnect au Burundi.\n" +
                "Analysez la commande vocale suivante de l'utilisateur (qui peut être en Français, en Kirundi, ou un mélange bilingue des deux) et extrayez les filtres de recherche de logement sous forme de JSON strict.\n\n" +
                "Commande vocale : \"" + transcript + "\"\n\n" +
                "Consignes :\n" +
                "1. Extrayez les filtres suivants :\n" +
                "   - \"city\": Nom exact de la ville parmi \"Bujumbura\", \"Gitega\", \"Ngozi\" (ou null si non précisé)\n" +
                "   - \"maxPrice\": Prix maximum en BIF sous forme de nombre entier (ou null si non précisé)\n" +
                "   - \"hasGenerator\": true si l'utilisateur demande explicitement un groupe électrogène / \"moteri\" / \"courant\" (ou null)\n" +
                "   - \"hasWaterTank\": true si l'utilisateur demande explicitement une citerne d'eau / \"ikigega\" / \"amazi\" (ou null)\n" +
                "   - \"hasStarlink\": true si l'utilisateur demande explicitement internet Starlink / \"umuhora\" / \"connexion\" (ou null)\n" +
                "   - \"hasSecurityGuard\": true si l'utilisateur demande un gardien / \"abazamu\" / \"sécurité\" (ou null)\n" +
                "   - \"hasKitchen\": true si l'utilisateur demande une cuisine / \"igikoni\" (ou null)\n" +
                "   - \"interpretedQuery\": Une phrase résumant l'intention en Français (ex: \"Logement à Gitega avec citerne d'eau sous 35 000 FBu\")\n\n" +
                "2. Renvoyez UNIQUEMENT le JSON strict sans aucun autre texte d'introduction, conclusion ou bloc de code Markdown (```).";

        Map<String, Object> requestBody = Map.of(
                "model", "claude-3-5-sonnet-20241022",
                "max_tokens", 500,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        String jsonPayload = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/messages"))
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Claude API returned status " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String rawText = root.path("content").get(0).path("text").asText().trim();

        // Nettoyer les blocs markdown éventuels
        String cleanJsonText = rawText.replaceAll("(?i)^```json\\s*", "").replaceAll("```$", "").trim();
        JsonNode parsed = objectMapper.readTree(cleanJsonText);

        Map<String, Object> filters = new HashMap<>();
        if (parsed.hasNonNull("city")) filters.put("city", parsed.get("city").asText());
        if (parsed.hasNonNull("maxPrice")) filters.put("maxPrice", parsed.get("maxPrice").asInt());
        if (parsed.hasNonNull("hasGenerator") && parsed.get("hasGenerator").asBoolean()) filters.put("hasGenerator", true);
        if (parsed.hasNonNull("hasWaterTank") && parsed.get("hasWaterTank").asBoolean()) filters.put("hasWaterTank", true);
        if (parsed.hasNonNull("hasStarlink") && parsed.get("hasStarlink").asBoolean()) filters.put("hasStarlink", true);
        if (parsed.hasNonNull("hasSecurityGuard") && parsed.get("hasSecurityGuard").asBoolean()) filters.put("hasSecurityGuard", true);
        if (parsed.hasNonNull("hasKitchen") && parsed.get("hasKitchen").asBoolean()) filters.put("hasKitchen", true);
        if (parsed.hasNonNull("interpretedQuery")) filters.put("interpretedQuery", parsed.get("interpretedQuery").asText());

        return filters;
    }

    private Map<String, Object> parseVoiceCommandFallback(String transcript) {
        String text = transcript.toLowerCase();
        Map<String, Object> filters = new HashMap<>();

        // 1. Détection de la ville
        if (text.contains("bujumbura") || text.contains("buja") || text.contains("bujo")) {
            filters.put("city", "Bujumbura");
        } else if (text.contains("gitega")) {
            filters.put("city", "Gitega");
        } else if (text.contains("ngozi")) {
            filters.put("city", "Ngozi");
        }

        // 2. Détection du prix maximum (ex: "munsi ya 30000", "sous 25 000", "max 40k")
        // Nettoyer les espaces entre les chiffres (ex: "30 000" -> "30000")
        String textCleanedDigits = text.replaceAll("(\\d+)\\s+(?=\\d)", "$1");

        // Chercher des nombres dans le texte
        Pattern pattern = Pattern.compile("\\b\\d+\\b");
        Matcher matcher = pattern.matcher(textCleanedDigits);
        List<Integer> priceCandidates = new ArrayList<>();
        while (matcher.find()) {
            try {
                int p = Integer.parseInt(matcher.group());
                if (p >= 5000) {
                    priceCandidates.add(p);
                }
            } catch (NumberFormatException e) {
                // Ignore
            }
        }

        if (!priceCandidates.isEmpty()) {
            filters.put("maxPrice", priceCandidates.get(0));
        } else {
            // Gérer les raccourcis k (ex: "40k" -> 40000)
            Pattern kPattern = Pattern.compile("\\b(\\d+)k\\b", Pattern.CASE_INSENSITIVE);
            Matcher kMatcher = kPattern.matcher(textCleanedDigits);
            if (kMatcher.find()) {
                try {
                    int p = Integer.parseInt(kMatcher.group(1)) * 1000;
                    filters.put("maxPrice", p);
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
        }

        // 3. Équipements clés (Burundi specific)
        if (text.contains("generator") || text.contains("moteri") || text.contains("electrogene") || text.contains("courant")) {
            filters.put("hasGenerator", true);
        }
        if (text.contains("tank") || text.contains("ikigega") || text.contains("citerne") || text.contains("amazi")) {
            filters.put("hasWaterTank", true);
        }
        if (text.contains("starlink") || text.contains("umuhora") || text.contains("internet") || text.contains("wifi")) {
            filters.put("hasStarlink", true);
        }
        if (text.contains("gardien") || text.contains("abazamu") || text.contains("securite") || text.contains("mulinzi")) {
            filters.put("hasSecurityGuard", true);
        }
        if (text.contains("cuisine") || text.contains("igikoni") || text.contains("igisafuri")) {
            filters.put("hasKitchen", true);
        }

        // 4. Formulation de l'intention résumée
        List<String> summaryParts = new ArrayList<>();
        if (filters.containsKey("city")) summaryParts.add("à " + filters.get("city"));
        if (filters.containsKey("maxPrice")) {
            summaryParts.add(String.format("sous %,d FBu", (Integer) filters.get("maxPrice")));
        }

        List<String> amenitiesList = new ArrayList<>();
        if (filters.containsKey("hasGenerator")) amenitiesList.add("groupe électrogène");
        if (filters.containsKey("hasWaterTank")) amenitiesList.add("citerne");
        if (filters.containsKey("hasStarlink")) amenitiesList.add("Starlink");
        if (filters.containsKey("hasSecurityGuard")) amenitiesList.add("gardien");
        if (filters.containsKey("hasKitchen")) amenitiesList.add("cuisine");

        if (!amenitiesList.isEmpty()) {
            summaryParts.add("avec " + String.join(", ", amenitiesList));
        }

        String interpretedQuery;
        if (!summaryParts.isEmpty()) {
            interpretedQuery = "Recherche : Logement " + String.join(" ", summaryParts);
        } else {
            interpretedQuery = "Recherche textuelle libre : \"" + transcript + "\"";
        }
        filters.put("interpretedQuery", interpretedQuery);

        return filters;
    }
}
