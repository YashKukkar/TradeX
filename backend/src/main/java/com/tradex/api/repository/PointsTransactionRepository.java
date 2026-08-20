package com.tradex.api.repository;

import com.tradex.api.entity.PointsTransaction;
import com.tradex.api.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PointsTransactionRepository extends JpaRepository<PointsTransaction, Long> {
    List<PointsTransaction> findByUserOrderByCreatedAtDesc(User user);

    List<PointsTransaction> findAllByOrderByCreatedAtDesc();

    List<PointsTransaction> findByCreatedAtBetweenOrderByCreatedAtDesc(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @Query("SELECT COALESCE(SUM(pt.amount), 0) FROM PointsTransaction pt WHERE pt.user = :user AND pt.amount > 0")
    Long sumPositivePointsByUser(@Param("user") User user);

    @Modifying
    @Query("DELETE FROM PointsTransaction pt WHERE pt.user IN :users")
    void deleteByUserIn(@Param("users") List<User> users);
}

