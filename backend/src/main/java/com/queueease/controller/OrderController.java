package com.queueease.controller;

import com.queueease.dto.ApiResponse;
import com.queueease.dto.Dtos.OrderReq;
import com.queueease.security.Auth;
import com.queueease.service.OrderService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class OrderController {
    private final OrderService service;

    @PostMapping(value = "/orders", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse create(@RequestPart("order") OrderReq req,
                              @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return ApiResponse.ok("Queue joined successfully", service.create(Auth.uid(), req, files));
    }

    /** Students get their own orders; staff get recent orders of everyone. */
    @GetMapping("/orders")
    public ApiResponse list() { return ApiResponse.ok(service.list(Auth.uid(), Auth.staff())); }

    @PostMapping("/queue/call-next")
    public ApiResponse callNext() { service.callNext(); return ApiResponse.ok("Next student called", null); }

    @PostMapping("/queue/{id}/{action}")
    public ApiResponse act(@PathVariable Long id, @PathVariable String action) {
        service.act(id, action);
        return ApiResponse.ok("Order updated", null);
    }

    @DeleteMapping("/queue/{id}")
    public ApiResponse leave(@PathVariable Long id) { service.leave(Auth.uid(), id); return ApiResponse.ok("You left the queue", null); }

    @GetMapping("/files/{fid}")
    public ResponseEntity<Resource> file(@PathVariable String fid, @RequestParam(defaultValue = "false") boolean view) {
        OrderService.FileData f = service.file(fid, Auth.uid(), Auth.staff(), view);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(f.type()))
            .header("Content-Disposition", "inline; filename=\"" + f.name().replaceAll("[^A-Za-z0-9._-]", "_") + "\"")
            .body(new FileSystemResource(f.path()));
    }
}
