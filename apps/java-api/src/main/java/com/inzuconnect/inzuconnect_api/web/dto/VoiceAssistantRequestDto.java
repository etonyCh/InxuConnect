package com.inzuconnect.inzuconnect_api.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = false)
public class VoiceAssistantRequestDto {
    @Size(max = 10_000, message = "transcript max 10k chars")
    @Pattern(regexp = "^[\\p{L}\\p{N}\\p{Punct}\\p{Space}’'`-]*$",
             message = "transcript contient des caractères interdits")
    private String transcript;

    @Size(max = 8_000_000, message = "audio base64 trop volumineux (8MB max)")
    @Pattern(regexp = "^[A-Za-z0-9+/=\\s]*$", message = "audio n'est pas un base64 valide")
    private String audio;

    @Size(max = 1_000, message = "mockTranscript max 1k chars")
    @Pattern(regexp = "^[\\p{L}\\p{N}\\p{Punct}\\p{Space}’'`-]*$",
             message = "mockTranscript contient des caractères interdits")
    private String mockTranscript;

    @AssertTrue(message = "au moins un champ parmi transcript, audio, mockTranscript doit être renseigné")
    public boolean hasAtLeastOneInput() {
        boolean t = transcript != null && !transcript.isBlank();
        boolean a = audio != null && !audio.isBlank();
        boolean m = mockTranscript != null && !mockTranscript.isBlank();
        return t || a || m;
    }

    @AssertTrue(message = "audio base64 invalide (longueur % 4 != 0)")
    public boolean isAudioBase64Valid() {
        if (audio == null || audio.isBlank()) return true;
        String s = audio.replaceAll("\\s", "");
        return s.length() % 4 == 0;
    }

    public String toSanitizedTranscript() {
        StringBuilder sb = new StringBuilder();
        if (transcript != null) sb.append(transcript.trim()).append(' ');
        if (mockTranscript != null) sb.append(mockTranscript.trim()).append(' ');
        String raw = sb.toString().replaceAll("\\s+", " ");
        if (raw.length() > 1200) raw = raw.substring(0, 1200);
        return raw;
    }
}
