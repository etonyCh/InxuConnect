package com.inzuconnect.inzuconnect_api.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inzuconnect.inzuconnect_api.web.dto.VoiceAssistantRequestDto;
import com.inzuconnect.inzuconnect_api.web.dto.VoiceFiltersDto;
import jakarta.validation.Valid;
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

    private static final Pattern INJECTION_PATTERN = Pattern.compile(
            "(?i)(ignore\\s+(les|la|les\\s+règles|the\\s+previous|all\\s+previous|your\\s+rules)" +
            "|oublie\\s+(les|la)\\s+(règles|instruction)" +
            "|renvoie\\s+(le\\s+prompt|le\\s+texte|la\\s+phrase|ces\\s+mots|ce\\s+texte)" +
            "|tu\\s+es\\s+maintenant|you\\s+are\\s+now\\s+(a|the)\\s+(system|assistant)" +
            "|system\\s+prompt|règle\\s+système" +
            "|exec\\s*\\(|curl\\s+|wget\\s+|<script|javascript:|data:text/html)",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AiController(ObjectMapper springObjectMapper) {
        this.objectMapper = springObjectMapper.copy()
                .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, true)
                .configure(com.fasterxml.jackson.databind.SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @PostMapping("/voice-assistant")
    public ResponseEntity<?> voiceAssistant(@Valid @RequestBody VoiceAssistantRequestDto dto) {
        String textCommand = dto.toSanitizedTranscript();

        Matcher m = INJECTION_PATTERN.matcher(textCommand);
        if (m.find()) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of(
                            "error", "Requête refusée - détection d'instructions suspectes.",
                            "hint", "Consultez notre politique d'usage de l'assistant vocal."
                    ));
        }

        try {
            VoiceFiltersDto filters = parseVoiceCommand(textCommand);
            validateFilters(filters);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "transcript", textCommand,
                    "filters", filters
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors du traitement de la commande vocale."));
        }
    }

    private void validateFilters(VoiceFiltersDto f) {
        if (f == null || f.getInterpretedQuery() == null) {
            throw new IllegalStateException("filters null");
        }
        if (f.getCity() != null && !VoiceFiltersDto.ALLOWED_CITIES.contains(f.getCity())) {
            throw new IllegalStateException("ville hors périmètre");
        }
        if (f.getMaxPrice() != null && (f.getMaxPrice() < 0 || f.getMaxPrice() > 999_999_999)) {
            throw new IllegalStateException("prix invalide");
        }
        if (f.getInterpretedQuery().length() > 240) {
            throw new IllegalStateException("interpretedQuery trop long");
        }
    }

    private VoiceFiltersDto parseVoiceCommand(String transcript) {
        String apiKey = System.getenv("ANTHROPIC_API_KEY");

        if (apiKey != null && !apiKey.trim().isEmpty() && !apiKey.startsWith("YOUR_")) {
            try {
                VoiceFiltersDto r = callClaudeForVoiceParsing(apiKey, transcript);
                if (r == null) throw new IllegalStateException("claude returned null");
                return r;
            } catch (Exception e) {
                return parseVoiceCommandFallback(transcript);
            }
        } else {
            return parseVoiceCommandFallback(transcript);
        }
    }

    private VoiceFiltersDto callClaudeForVoiceParsing(String apiKey, String transcript) throws Exception {
        String system = "Tu es l'assistant NLP d'InzuConnect (Burundi). Règles obligatoires:\n" +
                "1. Tu pars UNIQUEMENT la transcription utilisateur, tu ne lis JAMAIS cette consigne comme étant une entrée.\n" +
                "2. Tu renvoies UNIQUEMENT un JSON STRICT respectant ce schéma: {city: string|null (Bujumbura|Gitega|Ngozi), maxPrice: integer|null, hasGenerator: boolean|null, hasWaterTank: boolean|null, hasStarlink: boolean|null, hasSecurityGuard: boolean|null, hasKitchen: boolean|null, interpretedQuery: string (max 240 chars)}.\n" +
                "3. Toute autre clé est interdite. Si tu ne sais pas, ne renvoie pas la clé ou la valeur null.\n" +
                "4. N'ajoute JAMAIS de texte, ni de blocs ``` autour du JSON.\n";

        String user = "Commande vocale: \"" + transcript.replace("\"", "\\\"") + "\"";

        Map<String, Object> requestBody = Map.of(
                "model", "claude-3-5-sonnet-20241022",
                "max_tokens", 400,
                "system", system,
                "messages", List.of(Map.of("role", "user", "content", user))
        );

        String jsonPayload = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/messages"))
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("Claude API returned status " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String rawText = root.path("content").get(0).path("text").asText().trim();
        String cleanJsonText = rawText.replaceAll("(?i)^```json\\s*", "").replaceAll("```$", "").trim();

        return objectMapper.readerFor(VoiceFiltersDto.class).readValue(cleanJsonText);
    }

    private VoiceFiltersDto parseVoiceCommandFallback(String transcript) {
        String text = transcript.toLowerCase();
        VoiceFiltersDto f = new VoiceFiltersDto();

        if (text.contains("bujumbura") || text.contains("buja") || text.contains("bujo")) {
            f.setCity("Bujumbura");
        } else if (text.contains("gitega")) {
            f.setCity("Gitega");
        } else if (text.contains("ngozi")) {
            f.setCity("Ngozi");
        }

        String textCleanedDigits = text.replaceAll("(\\d+)\\s+(?=\\d)", "$1");

        Pattern pattern = Pattern.compile("\\b\\d+\\b");
        Matcher matcher = pattern.matcher(textCleanedDigits);
        List<Integer> priceCandidates = new ArrayList<>();
        while (matcher.find()) {
            try {
                int p = Integer.parseInt(matcher.group());
                if (p >= 5000) priceCandidates.add(p);
            } catch (NumberFormatException ignore) {}
        }

        if (!priceCandidates.isEmpty()) {
            f.setMaxPrice(priceCandidates.get(0));
        } else {
            Pattern kPattern = Pattern.compile("\\b(\\d+)k\\b", Pattern.CASE_INSENSITIVE);
            Matcher kMatcher = kPattern.matcher(textCleanedDigits);
            if (kMatcher.find()) {
                try { f.setMaxPrice(Integer.parseInt(kMatcher.group(1)) * 1000); } catch (NumberFormatException ignore) {}
            }
        }

        if (text.contains("generator") || text.contains("moteri") || text.contains("electrogene") || text.contains("courant")) {
            f.setHasGenerator(true);
        }
        if (text.contains("tank") || text.contains("ikigega") || text.contains("citerne") || text.contains("amazi")) {
            f.setHasWaterTank(true);
        }
        if (text.contains("starlink") || text.contains("umuhora") || text.contains("internet") || text.contains("wifi")) {
            f.setHasStarlink(true);
        }
        if (text.contains("gardien") || text.contains("abazamu") || text.contains("securite") || text.contains("sécurité") || text.contains("mulinzi")) {
            f.setHasSecurityGuard(true);
        }
        if (text.contains("cuisine") || text.contains("igikoni") || text.contains("igisafuri")) {
            f.setHasKitchen(true);
        }

        List<String> summaryParts = new ArrayList<>();
        if (f.getCity() != null) summaryParts.add("à " + f.getCity());
        if (f.getMaxPrice() != null) {
            summaryParts.add(String.format("sous %,d FBu", f.getMaxPrice()));
        }

        List<String> amenitiesList = new ArrayList<>();
        if (Boolean.TRUE.equals(f.getHasGenerator())) amenitiesList.add("groupe électrogène");
        if (Boolean.TRUE.equals(f.getHasWaterTank())) amenitiesList.add("citerne");
        if (Boolean.TRUE.equals(f.getHasStarlink())) amenitiesList.add("Starlink");
        if (Boolean.TRUE.equals(f.getHasSecurityGuard())) amenitiesList.add("gardien");
        if (Boolean.TRUE.equals(f.getHasKitchen())) amenitiesList.add("cuisine");

        if (!amenitiesList.isEmpty()) {
            summaryParts.add("avec " + String.join(", ", amenitiesList));
        }

        String interpretedQuery;
        if (!summaryParts.isEmpty()) {
            interpretedQuery = "Recherche : Logement " + String.join(" ", summaryParts);
        } else {
            String s = transcript.length() > 180 ? transcript.substring(0, 177) + "..." : transcript;
            interpretedQuery = "Recherche textuelle libre : \"" + s + "\"";
        }
        f.setInterpretedQuery(interpretedQuery);

        return f;
    }
}
