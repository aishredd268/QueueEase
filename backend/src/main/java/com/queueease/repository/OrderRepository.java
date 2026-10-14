package com.queueease.repository;

import com.queueease.entity.ShopOrder;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<ShopOrder, Long> {
    List<ShopOrder> findByUserIdOrderByIdAsc(Long userId);
    List<ShopOrder> findByJoinedAtAfterOrderByIdAsc(LocalDateTime t);
    List<ShopOrder> findByTokenDateAndStatusIn(LocalDate d, Collection<String> statuses);
    Optional<ShopOrder> findFirstByUserIdAndStatusInOrderByIdDesc(Long userId, Collection<String> statuses);
    Optional<ShopOrder> findFirstByTokenDateAndStatusOrderByTokenAsc(LocalDate d, String status);
    @Query("select o from ShopOrder o join o.files f where f.fid = :fid")
    Optional<ShopOrder> findByFileId(@Param("fid") String fid);
}
