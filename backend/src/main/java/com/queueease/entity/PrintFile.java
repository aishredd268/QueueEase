package com.queueease.entity;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable @Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PrintFile {
    private String fid;
    private String name;
    private String ext;
    private long size;
    private int pages;
    private String pageRange;
    private String color;
    private String sides;
    private int copies;
    private String paper;
    private String paperType;
    private String storedPath;
    private boolean seen;
    private int cost;
}
