package com.securecommerce.platform.address.repository;

import com.securecommerce.platform.address.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);

    Optional<Address> findByUserIdAndIsDefaultTrue(Long userId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.user.id = :userId")
    void clearDefaultAddressesForUser(@Param("userId") Long userId);
}
