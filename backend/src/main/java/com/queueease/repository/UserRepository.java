package com.queueease.repository;

import com.queueease.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByRollNoIgnoreCase(String rollNo);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByRollNoIgnoreCase(String rollNo);
}
