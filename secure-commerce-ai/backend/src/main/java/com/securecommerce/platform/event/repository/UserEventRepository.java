package com.securecommerce.platform.event.repository;

import com.securecommerce.platform.event.entity.EventType;
import com.securecommerce.platform.event.entity.UserEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * UserEventRepository — Spring Data JPA repository for persisted events.
 */
@Repository
public interface UserEventRepository extends JpaRepository<UserEvent, Long> {

    List<UserEvent> findByUserIdOrderByEventTimestampDesc(Long userId);

    List<UserEvent> findByEventTypeOrderByEventTimestampDesc(EventType eventType);

    List<UserEvent> findBySessionIdOrderByEventTimestampAsc(String sessionId);

    List<UserEvent> findByReferenceTypeAndReferenceIdOrderByEventTimestampDesc(String referenceType, String referenceId);

    @Query("SELECT e FROM UserEvent e WHERE " +
           "(:userId IS NULL OR e.userId = :userId) AND " +
           "(:eventType IS NULL OR e.eventType = :eventType) AND " +
           "(:startDate IS NULL OR e.eventTimestamp >= :startDate) AND " +
           "(:endDate IS NULL OR e.eventTimestamp <= :endDate) " +
           "ORDER BY e.eventTimestamp DESC")
    Page<UserEvent> searchEvents(
            @Param("userId") Long userId,
            @Param("eventType") EventType eventType,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable
    );

    @Query("SELECT e FROM UserEvent e WHERE " +
           "(:eventType IS NULL OR e.eventType = :eventType) AND " +
           "(:startDate IS NULL OR e.eventTimestamp >= :startDate) AND " +
           "(:endDate IS NULL OR e.eventTimestamp <= :endDate) " +
           "ORDER BY e.eventTimestamp ASC")
    List<UserEvent> findForExport(
            @Param("eventType") EventType eventType,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );
}
