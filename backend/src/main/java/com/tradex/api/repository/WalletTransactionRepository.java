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
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByUserOrderByCreatedAtDesc(User user);
    boolean existsByUserIdAndTypeAndStatus(Long userId, WalletTransactionType type, WalletTransactionStatus status);

    List<WalletTransaction> findByStatusOrderByCreatedAtDesc(WalletTransactionStatus status);
    List<WalletTransaction> findAllByOrderByApprovedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT wt FROM WalletTransaction wt WHERE wt.id = :id")
    Optional<WalletTransaction> findByIdForUpdate(@Param("id") Long id);

    @Modifying
    @Query("DELETE FROM WalletTransaction wt WHERE wt.user IN :users")
    void deleteByUserIn(@Param("users") List<User> users);
}
