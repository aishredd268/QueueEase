package com.queueease.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class Dtos {
    public record RegisterReq(
        @NotBlank(message = "Please enter a username.")
        @Pattern(regexp = "^[A-Za-z0-9_.]{3,30}$", message = "Username must be 3-30 characters (letters, digits, _ or .).") String username,
        @NotBlank(message = "Please enter your roll number.")
        @Pattern(regexp = "^[A-Za-z0-9]{3,20}$", message = "Roll number must be 3-20 letters or digits.") String rollNo,
        @NotBlank(message = "Please enter a password.") @Size(min = 6, message = "Password must be at least 6 characters.") String password) {}

    public record LoginReq(
        @NotBlank(message = "Please enter your username or roll number.") String identifier,
        @NotBlank(message = "Please enter your password.") String password) {}

    public record ItemReq(@NotBlank(message = "Please enter a name.") String name, String category,
                          @Min(0) int price, @Min(0) int stock) {}
    public record ItemUpdate(String name, String category, Integer price, Integer stock) {}
    public record ItemQty(Long id, int qty) {}
    public record FileOpt(String name, String range, String color, String sides, Integer copies, String paper, String type) {}
    public record OrderReq(List<ItemQty> items, String binding, String bindingColor, String coverType, List<FileOpt> files) {}
}
