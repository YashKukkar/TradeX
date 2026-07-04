package com.tradex.api.repository;

import com.tradex.api.entity.User;
import com.tradex.api.entity.VerificationToken;
import com.tradex.api.enums.VerificationType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByUserAndType(User user, VerificationType type);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT vt FROM VerificationToken vt WHERE vt.user = :user AND vt.type = :type")
    Optional<VerificationToken> findByUserAndTypeForUpdate(@Param("user") User user, @Param("type") VerificationType type);

    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.user IN :users")
    void deleteByUserIn(@Param("users") java.util.List<User> users);
}

