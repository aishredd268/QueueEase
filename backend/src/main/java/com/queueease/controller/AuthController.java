package com.queueease.controller;

import com.queueease.dto.ApiResponse;
import com.queueease.dto.Dtos.*;
import com.queueease.entity.User;
import com.queueease.exception.ApiException;
import com.queueease.repository.UserRepository;
import com.queueease.security.Auth;
import com.queueease.security.JwtService;
import jakarta.validation.Valid;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @PostMapping("/register")
    public ApiResponse register(@Valid @RequestBody RegisterReq r) {
        String un = r.username().trim();
        String roll = r.rollNo().trim().toUpperCase();
        if (users.existsByRollNoIgnoreCase(roll)) throw new ApiException(409, "An account already exists for this roll number.");
        if (users.existsByUsernameIgnoreCase(un)) throw new ApiException(409, "This username is already taken.");
        // keep login unambiguous: a username may not equal someone else's roll number
        if (!un.equalsIgnoreCase(roll) && (users.existsByUsernameIgnoreCase(roll) || users.existsByRollNoIgnoreCase(un)))
            throw new ApiException(409, "This username is not available. Please choose another.");
        User u = new User();
        u.setUsername(un); u.setRollNo(roll);
        u.setPassword(encoder.encode(r.password())); u.setRole("STUDENT");
        users.save(u);
        return ApiResponse.ok("Account created", Map.of("token", jwt.create(u), "user", view(u)));
    }

    @PostMapping("/login")
    public ApiResponse login(@Valid @RequestBody LoginReq r) {
        String id = r.identifier().trim();
        User u = users.findByUsernameIgnoreCase(id).or(() -> users.findByRollNoIgnoreCase(id))
            .filter(x -> encoder.matches(r.password(), x.getPassword()))
            .orElseThrow(() -> new ApiException(401, "Incorrect username/roll number or password."));
        return ApiResponse.ok("Login successful", Map.of("token", jwt.create(u), "user", view(u)));
    }

    @GetMapping("/me")
    public ApiResponse me() {
        return ApiResponse.ok(view(users.findById(Auth.uid()).orElseThrow(() -> new ApiException(401, "Please login again."))));
    }

    @PostMapping("/logout")
    public ApiResponse logout() { return ApiResponse.ok("Logged out", null); }

    static Map<String, Object> view(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("role", u.getRole()); m.put("name", u.getUsername());
        m.put("id", u.getRollNo() == null ? u.getRole() : u.getRollNo());
        return m;
    }
}
