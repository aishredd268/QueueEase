package com.queueease.controller;

import com.queueease.dto.ApiResponse;
import com.queueease.entity.Notification;
import com.queueease.exception.ApiException;
import com.queueease.repository.NotificationRepository;
import com.queueease.security.Auth;
import java.time.ZoneId;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationRepository repo;

    @GetMapping
    public ApiResponse mine() {
        return ApiResponse.ok(repo.findByUserIdOrderByCreatedAtDesc(Auth.uid()).stream().limit(50).map(n -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", n.getId()); m.put("m", n.getMessage()); m.put("r", n.isSeen());
            m.put("t", n.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            return m;
        }).toList());
    }

    @PutMapping("/read-all")
    public ApiResponse readAll() {
        List<Notification> l = repo.findByUserIdOrderByCreatedAtDesc(Auth.uid());
        l.forEach(n -> n.setSeen(true));
        repo.saveAll(l);
        return ApiResponse.ok("OK", null);
    }

    @PutMapping("/{id}/read")
    public ApiResponse read(@PathVariable Long id) {
        Notification n = repo.findById(id).filter(x -> x.getUserId().equals(Auth.uid()))
            .orElseThrow(() -> new ApiException(404, "Notification not found."));
        n.setSeen(true);
        repo.save(n);
        return ApiResponse.ok("OK", null);
    }
}
