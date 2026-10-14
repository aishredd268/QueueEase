package com.queueease.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "app_setting") @Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Setting {
    @Id private String name;
    private String val;
}
