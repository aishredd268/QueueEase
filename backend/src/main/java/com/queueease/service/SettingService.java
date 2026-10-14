package com.queueease.service;

import com.queueease.entity.Setting;
import com.queueease.repository.SettingRepository;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Prices, service times, shop status and the daily token counter, all stored in PostgreSQL. */
@Service @RequiredArgsConstructor
public class SettingService {
    private final SettingRepository repo;

    public int get(String k, int d) { return repo.findById(k).map(s -> Integer.parseInt(s.getVal())).orElse(d); }
    public void set(String k, int v) { repo.save(new Setting(k, String.valueOf(v))); }
    public boolean isOpen() { return get("shop_open", 1) == 1; }

    public Map<String, Integer> prices() {
        Map<String, Integer> m = new LinkedHashMap<>();
        m.put("bw", get("price_bw", 2)); m.put("color", get("price_color", 5));
        m.put("spiral", get("price_spiral", 30)); m.put("thermal", get("price_thermal", 40));
        return m;
    }

    public Map<String, Integer> times() {
        Map<String, Integer> m = new LinkedHashMap<>();
        m.put("s", get("svc_s", 3)); m.put("p", get("svc_p", 5)); m.put("b", get("svc_b", 8));
        return m;
    }

    private void rollover() {
        long today = LocalDate.now().toEpochDay();
        if (get("token_day", -1) != today) { set("token_day", (int) today); set("last_token", 0); set("serving", 0); }
    }

    @Transactional
    public synchronized int nextToken() {
        rollover();
        int n = get("last_token", 0) + 1;
        set("last_token", n);
        return n;
    }

    @Transactional
    public Map<String, Object> shop() {
        rollover();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("open", isOpen()); m.put("t", times()); m.put("opens", "9:00 AM"); m.put("serving", get("serving", 0));
        return m;
    }
}
