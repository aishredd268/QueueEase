package com.queueease.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity @Table(name = "app_users") @Getter @Setter @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(unique = true, nullable = false) private String username;
    /** Students only. Unique, so one roll number can never have two accounts. */
    @Column(unique = true) private String rollNo;
    @Column(nullable = false) private String password;   // BCrypt hash
    @Column(nullable = false) private String role;       // STUDENT or STAFF
    private LocalDateTime createdAt = LocalDateTime.now();
}
