package com.inzuconnect.inzuconnect_api.rag;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class SimpleTextChunker {

    private static final int DEFAULT_CHUNK_SIZE = 500;
    private static final int DEFAULT_OVERLAP = 80;
    private static final Pattern PARAGRAPH_SPLIT = Pattern.compile("\\n\\s*\\n");
    private static final Pattern SENTENCE_SPLIT = Pattern.compile("(?<=[.!?])\\s+");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    public List<String> chunk(String text) {
        return chunk(text, DEFAULT_CHUNK_SIZE, DEFAULT_OVERLAP);
    }

    public List<String> chunk(String text, int chunkSize, int overlap) {
        if (text == null || text.isBlank()) return List.of();

        String cleaned = WHITESPACE.matcher(text.trim()).replaceAll(" ");
        if (cleaned.length() <= chunkSize) {
            return List.of(cleaned);
        }

        List<String> sentences = new ArrayList<>();
        for (String paragraph : PARAGRAPH_SPLIT.split(cleaned)) {
            for (String sentence : SENTENCE_SPLIT.split(paragraph)) {
                String s = sentence.trim();
                if (!s.isEmpty()) sentences.add(s);
            }
        }

        if (sentences.isEmpty()) {
            return slidingWindow(cleaned, chunkSize, overlap);
        }

        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        String lastTail = "";

        for (String sentence : sentences) {
            String candidate;
            if (current.isEmpty() && !lastTail.isEmpty()) {
                candidate = lastTail + " " + sentence;
            } else if (current.isEmpty()) {
                candidate = sentence;
            } else {
                candidate = current + " " + sentence;
            }

            if (candidate.length() <= chunkSize) {
                current.setLength(0);
                current.append(candidate);
            } else {
                if (current.length() > 0) {
                    chunks.add(current.toString().trim());
                    lastTail = tailOf(current.toString(), overlap);
                    current.setLength(0);
                }
                if (sentence.length() > chunkSize) {
                    chunks.addAll(slidingWindow(sentence, chunkSize, overlap));
                    lastTail = tailOf(sentence, overlap);
                } else {
                    if (!lastTail.isEmpty()) {
                        current.append(lastTail).append(" ");
                    }
                    current.append(sentence);
                }
            }
        }
        if (current.length() > 0) {
            chunks.add(current.toString().trim());
        }

        List<String> result = new ArrayList<>();
        for (String c : chunks) {
            if (!c.isBlank()) result.add(c);
        }
        return result;
    }

    private List<String> slidingWindow(String text, int size, int overlap) {
        List<String> out = new ArrayList<>();
        int step = Math.max(1, size - overlap);
        int i = 0;
        while (i < text.length()) {
            int end = Math.min(text.length(), i + size);
            out.add(text.substring(i, end).trim());
            if (end == text.length()) break;
            i += step;
        }
        return out;
    }

    private String tailOf(String s, int overlap) {
        if (s.length() <= overlap) return s;
        int start = s.length() - overlap;
        int firstSpace = s.indexOf(' ', start);
        if (firstSpace < 0) return s.substring(start);
        return s.substring(firstSpace + 1);
    }
}
