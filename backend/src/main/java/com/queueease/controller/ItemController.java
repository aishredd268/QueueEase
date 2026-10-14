package com.queueease.controller;

import com.queueease.dto.ApiResponse;
import com.queueease.dto.Dtos.*;
import com.queueease.entity.Item;
import com.queueease.exception.ApiException;
import com.queueease.repository.ItemRepository;
import jakarta.validation.Valid;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/items") @RequiredArgsConstructor
public class ItemController {
    private final ItemRepository items;

    @GetMapping
    public ApiResponse all() { return ApiResponse.ok(items.findAll().stream().sorted(Comparator.comparing(Item::getId)).map(this::view).toList()); }

    @GetMapping("/{id}")
    public ApiResponse one(@PathVariable Long id) { return ApiResponse.ok(view(find(id))); }

    @PostMapping
    public ApiResponse add(@Valid @RequestBody ItemReq r) {
        Item i = new Item();
        i.setName(r.name().trim()); i.setCategory(r.category() == null || r.category().isBlank() ? "Other" : r.category().trim());
        i.setPrice(r.price()); i.setStock(r.stock());
        return ApiResponse.ok("Item added", view(items.save(i)));
    }

    @PutMapping("/{id}")
    public ApiResponse update(@PathVariable Long id, @RequestBody ItemUpdate r) {
        Item i = find(id);
        if (r.name() != null && !r.name().isBlank()) i.setName(r.name().trim());
        if (r.category() != null && !r.category().isBlank()) i.setCategory(r.category().trim());
        if (r.price() != null) { if (r.price() < 0) throw new ApiException(400, "Price cannot be negative."); i.setPrice(r.price()); }
        if (r.stock() != null) { if (r.stock() < 0) throw new ApiException(400, "Stock cannot be negative."); i.setStock(r.stock()); }
        return ApiResponse.ok("Item updated", view(items.save(i)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse delete(@PathVariable Long id) { items.delete(find(id)); return ApiResponse.ok("Item deleted", null); }

    private Item find(Long id) { return items.findById(id).orElseThrow(() -> new ApiException(404, "Item not found.")); }

    private Map<String, Object> view(Item i) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", i.getId()); m.put("name", i.getName()); m.put("cat", i.getCategory());
        m.put("price", i.getPrice()); m.put("stock", i.getStock()); m.put("icon", i.getIcon());
        return m;
    }
}
