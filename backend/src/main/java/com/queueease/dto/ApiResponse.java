package com.queueease.dto;

public record ApiResponse(boolean success, String message, Object data) {
    public static ApiResponse ok(Object data) { return new ApiResponse(true, "OK", data); }
    public static ApiResponse ok(String message, Object data) { return new ApiResponse(true, message, data); }
    public static ApiResponse fail(String message) { return new ApiResponse(false, message, null); }
}
