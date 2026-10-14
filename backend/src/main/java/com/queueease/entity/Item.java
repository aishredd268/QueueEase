package com.queueease.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "stationery_item") @Getter @Setter @NoArgsConstructor
public class Item {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String name;
    private String category;
    private int price;
    private int stock;
    private String icon = "📦";
}
