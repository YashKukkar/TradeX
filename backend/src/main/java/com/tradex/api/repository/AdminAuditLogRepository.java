package com.tradex.api.repository;

import com.tradex.api.entity.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tradex.api.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    @Modifying
    @Query("DELETE FROM AdminAuditLog a WHERE a.actor IN :users OR a.target IN :users")
    void deleteByActorInOrTargetIn(@Param("users") List<User> users);

    Page<AdminAuditLog> findByTargetEmailOrderByCreatedAtDesc(String email, Pageable pageable);

    default Page<AdminAuditLog> findByTargetEmail(String email, Pageable pageable) {
        return findByTargetEmailOrderByCreatedAtDesc(email, pageable);
    }
}
