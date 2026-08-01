package com.inzuconnect.inzuconnect_api.web.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Controller
public class ChatController {

    private final List<Map<String, Object>> mockChatHistory = new ArrayList<>();

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public Map<String, Object> sendMessage(@Payload Map<String, Object> chatMessage) {
        chatMessage.put("timestamp", LocalDateTime.now().toString());
        mockChatHistory.add(chatMessage);
        return chatMessage;
    }

    @GetMapping("/api/v1/chat/messages")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getChatMessages() {
        if (mockChatHistory.isEmpty()) {
            mockChatHistory.add(Map.of(
                    "sender", "Jean-Claude (Hôte)",
                    "content", "Amahoro ! Bienvenue au Burundi. Avez-vous des questions sur votre séjour ?",
                    "timestamp", LocalDateTime.now().minusHours(2).toString()
            ));
        }
        return ResponseEntity.ok(mockChatHistory);
    }
}
