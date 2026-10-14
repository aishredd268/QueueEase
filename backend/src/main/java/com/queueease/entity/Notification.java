package com.queueease.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId;
    @Column(length = 500) private String message;
    private boolean seen;
    private LocalDateTime createdAt = LocalDateTime.now();
    public Notification(Long userId, String message) { this.userId = userId; this.message = message; }
}
