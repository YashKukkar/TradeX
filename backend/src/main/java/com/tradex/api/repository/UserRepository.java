package com.tradex.api.repository;

import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id IN :ids")
    List<User> findAllByIdForUpdate(@Param("ids") List<Long> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);

    @Modifying
    @Query("UPDATE User u SET u.failedLoginAttempts = u.failedLoginAttempts + 1 WHERE u.id = :userId")
    void incrementFailedLoginAttempts(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE User u SET u.failedLoginAttempts = 0, u.locked = false, u.lockedUntil = null WHERE u.id = :userId")
    void resetFailedLoginAttemptsAndUnlock(@Param("userId") Long userId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.referredBy WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);

    boolean existsByEmail(String email);

    Optional<User> findByReferralCode(String referralCode);

    boolean existsByReferralCode(String referralCode);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.referredBy")
    List<User> findAllWithReferredBy();

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.referredBy WHERE u.referralPath LIKE CONCAT(:prefix, '%')")
    List<User> findByReferralPathStartingWith(@Param("prefix") String prefix);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE User u SET u.pointsBalance = COALESCE(u.pointsBalance, 0) + :points WHERE u.id = :userId")
    int incrementPointsBalance(@Param("userId") Long userId, @Param("points") Long points);

    long countByRole(Role role);

    long countByRoleAndCreatedAtBetween(Role role, LocalDateTime start, LocalDateTime end);

    List<User> findByRole(Role role);
}
