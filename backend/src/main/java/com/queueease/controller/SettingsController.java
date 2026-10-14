package com.queueease.controller;

import com.queueease.dto.ApiResponse;
import com.queueease.exception.ApiException;
import com.queueease.service.SettingService;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class SettingsController {
    private final SettingService settings;

    @GetMapping("/pricing") public ApiResponse pricing() { return ApiResponse.ok(settings.prices()); }

    @PutMapping("/pricing")
    public ApiResponse setPricing(@RequestBody Map<String, Object> b) {
        for (String k : List.of("bw", "color", "spiral", "thermal"))
            if (b.get(k) instanceof Number n) {
                if (n.intValue() < 0) throw new ApiException(400, "Price cannot be negative.");
                settings.set("price_" + k, n.intValue());
            }
        return ApiResponse.ok("Pricing updated", settings.prices());
    }

    @GetMapping("/shop") public ApiResponse shop() { return ApiResponse.ok(settings.shop()); }

    @PutMapping("/shop")
    public ApiResponse setShop(@RequestBody Map<String, Object> b) {
        if (b.get("open") instanceof Boolean o) settings.set("shop_open", o ? 1 : 0);
        for (String k : List.of("s", "p", "b"))
            if (b.get(k) instanceof Number n) {
                if (n.intValue() < 0) throw new ApiException(400, "Time cannot be negative.");
                settings.set("svc_" + k, n.intValue());
            }
        return ApiResponse.ok("Shop updated", settings.shop());
    }
}
