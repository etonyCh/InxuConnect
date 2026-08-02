package com.inzuconnect.inzuconnect_api.web.controller;

import com.inzuconnect.inzuconnect_api.web.dto.ChatMessageDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class ChatController {

    private final List<Map<String, Object>> chatHistory = java.util.Collections.synchronizedList(new ArrayList<>());

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public Map<String, Object> sendMessage(@Valid @Payload ChatMessageDto dto) {
        Map<String, Object> chatMessage = new HashMap<>();
        chatMessage.put("senderId", dto.getSenderId());
        chatMessage.put("receiverId", dto.getReceiverId());
        chatMessage.put("content", dto.getContent());
        chatMessage.put("chatRoomId", dto.getChatRoomId());
        chatMessage.put("timestamp", dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now().toString());
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
