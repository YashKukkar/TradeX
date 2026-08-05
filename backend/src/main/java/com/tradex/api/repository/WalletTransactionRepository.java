package com.tradex.api.repository;

import com.tradex.api.entity.User;
import com.tradex.api.entity.WalletTransaction;
import com.tradex.api.enums.WalletTransactionType;

import jakarta.persistence.LockModeType;

import com.tradex.api.enums.WalletTransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByUserOrderByCreatedAtDesc(User user);

    Optional<WalletTransaction> findByIdempotencyKey(String idempotencyKey);

    boolean existsByUserIdAndTypeAndStatus(Long userId, WalletTransactionType type, WalletTransactionStatus status);

    List<WalletTransaction> findByStatusOrderByCreatedAtDesc(WalletTransactionStatus status);

    List<WalletTransaction> findAllByOrderByApprovedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT wt FROM WalletTransaction wt WHERE wt.id = :id")
    Optional<WalletTransaction> findByIdForUpdate(@Param("id") Long id);

    @Modifying
    @Query("DELETE FROM WalletTransaction wt WHERE wt.user IN :users")
    void deleteByUserIn(@Param("users") List<User> users);

    long countByTypeAndStatusAndCreatedAtBetween(WalletTransactionType type, WalletTransactionStatus status,
            LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(wt.amount), 0) FROM WalletTransaction wt WHERE wt.type = :type AND wt.status = :status AND wt.createdAt BETWEEN :start AND :end")
    java.math.BigDecimal sumAmountByTypeAndStatusAndCreatedAtBetween(
            @Param("type") WalletTransactionType type,
            @Param("status") WalletTransactionStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    long countByTypeAndStatus(WalletTransactionType type, WalletTransactionStatus status);

    @Query("SELECT COALESCE(SUM(wt.amount), 0) FROM WalletTransaction wt WHERE wt.type = :type AND wt.status = :status")
    java.math.BigDecimal sumAmountByTypeAndStatus(
            @Param("type") WalletTransactionType type,
            @Param("status") WalletTransactionStatus status);

    interface EmployeeWalletPerformanceProjection {
        Long getEmployeeId();

        WalletTransactionType getType();

        Long getTxCount();
    }

    @Query("SELECT wt.processedBy.id AS employeeId, wt.type AS type, COUNT(wt) AS txCount " +
            "FROM WalletTransaction wt " +
            "WHERE wt.status = :status AND wt.createdAt BETWEEN :start AND :end AND wt.processedBy IS NOT NULL " +
            "GROUP BY wt.processedBy.id, wt.type")
    List<EmployeeWalletPerformanceProjection> getEmployeeWalletPerformance(
            @Param("status") WalletTransactionStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    interface EmployeeTxProcessingTimeProjection {
        Long getEmployeeId();
        LocalDateTime getCreatedAt();
        LocalDateTime getApprovedAt();
    }

    @Query("SELECT wt.processedBy.id AS employeeId, wt.createdAt AS createdAt, wt.approvedAt AS approvedAt FROM WalletTransaction wt " +
           "WHERE wt.status = :status AND wt.approvedAt BETWEEN :start AND :end AND wt.processedBy IS NOT NULL")
    List<EmployeeTxProcessingTimeProjection> getEmployeeTxProcessingTimes(
            @Param("status") WalletTransactionStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
