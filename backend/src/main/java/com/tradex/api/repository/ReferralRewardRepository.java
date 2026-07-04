package com.tradex.api.repository;

import com.tradex.api.entity.ReferralReward;
import com.tradex.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReferralRewardRepository extends JpaRepository<ReferralReward, Long> {
    List<ReferralReward> findByReferrer(User referrer);

    @Query("SELECT r FROM ReferralReward r JOIN FETCH r.referredUser WHERE r.referrer = :referrer ORDER BY r.createdAt DESC")
    List<ReferralReward> findByReferrerOrderByCreatedAtDesc(@Param("referrer") User referrer);

    @Modifying
    @Query("DELETE FROM ReferralReward rr WHERE rr.referrer IN :users OR rr.referredUser IN :users")
    void deleteByReferrerOrReferredUserIn(@Param("users") List<User> users);

    boolean existsByReferredUserId(Long referredUserId);
}

