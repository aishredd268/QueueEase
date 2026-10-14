package com.queueease.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import lombok.*;

/** One queue token = one order (stationery and/or printing + binding). */
@Entity @Table(name = "orders", uniqueConstraints = @UniqueConstraint(columnNames = {"token_date", "token"}))
@Getter @Setter @NoArgsConstructor
public class ShopOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId;
    private String studentId;
    private String studentName;
    private int token;
    private LocalDate tokenDate;
    private String status;        // pending, waiting, called, processing, printing, binding, ready, completed, skipped, cancelled, rejected
    private String binding = "none";
    private String bindingColor;
    private String coverType;
    private int total;
    private int stationeryTotal;
    private LocalDateTime joinedAt;
    private LocalDateTime calledAt;
    private LocalDateTime readyAt;
    private LocalDateTime doneAt;
    @ElementCollection(fetch = FetchType.EAGER) @CollectionTable(name = "order_items") @OrderColumn
    private List<OrderLine> items = new ArrayList<>();
    @ElementCollection(fetch = FetchType.EAGER) @CollectionTable(name = "order_files") @OrderColumn
    private List<PrintFile> files = new ArrayList<>();
}
