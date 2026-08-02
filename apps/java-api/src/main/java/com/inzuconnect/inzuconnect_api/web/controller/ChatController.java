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

    private final List<Map<String, Object>> chatHistory = java.util.Collections.synchronizedList(new ArrayList<>());

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public Map<String, Object> sendMessage(@Payload Map<String, Object> chatMessage) {
        chatMessage.put("timestamp", LocalDateTime.now().toString());
        chatHistory.add(chatMessage);
        return chatMessage;
    }

    @GetMapping("/api/v1/chat/messages")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getChatMessages() {
        List<Map<String, Object>> snapshot;
        synchronized (chatHistory) {
            snapshot = new ArrayList<>(chatHistory);
        }
        return ResponseEntity.ok(snapshot);
    }
}
