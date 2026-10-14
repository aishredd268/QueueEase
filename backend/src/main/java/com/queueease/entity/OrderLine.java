package com.queueease.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable @Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderLine {
    private Long itemId;
    private String name;
    private int qty;
    private int unitPrice;
}
