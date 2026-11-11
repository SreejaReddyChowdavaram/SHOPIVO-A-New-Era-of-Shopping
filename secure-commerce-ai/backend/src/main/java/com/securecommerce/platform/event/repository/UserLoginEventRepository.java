package com.securecommerce.platform.event.repository;

import com.securecommerce.platform.event.entity.UserLoginEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface UserLoginEventRepository extends JpaRepository<UserLoginEvent, Long>, JpaSpecificationExecutor<UserLoginEvent> {

    List<UserLoginEvent> findTop20ByUserIdOrderByLoginTimestampDesc(Long userId);

    List<UserLoginEvent> findTop10ByUserEmailIgnoreCaseOrderByLoginTimestampDesc(String userEmail);

    Page<UserLoginEvent> findByUserIdOrderByLoginTimestampDesc(Long userId, Pageable pageable);

    long countByLoginResult(String loginResult);

    @Query("SELECT COUNT(e) FROM UserLoginEvent e WHERE e.userEmail = :email AND e.loginResult = 'FAILED' AND e.loginTimestamp >= :since")
    long countFailedAttemptsSince(@Param("email") String email, @Param("since") Instant since);

    @Modifying
    @Query("DELETE FROM UserLoginEvent e WHERE e.loginTimestamp < :cutoff")
    int deleteOldEvents(@Param("cutoff") Instant cutoff);
}

