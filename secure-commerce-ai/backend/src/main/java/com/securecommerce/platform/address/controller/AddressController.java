package com.securecommerce.platform.address.controller;

import com.securecommerce.platform.address.dto.AddressRequest;
import com.securecommerce.platform.address.dto.AddressResponse;
import com.securecommerce.platform.address.service.AddressService;
import com.securecommerce.platform.common.ApiResponse;
import com.securecommerce.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AddressController — Manage customer shipping addresses
 *
 * GET    /api/addresses        → get current customer's addresses
 * GET    /api/addresses/{id}   → get specific address
 * POST   /api/addresses        → create address
 * PUT    /api/addresses/{id}   → update address
 * DELETE /api/addresses/{id}   → delete address
 */
@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getMyAddresses(
            @AuthenticationPrincipal User currentUser) {
        List<AddressResponse> addresses = addressService.getMyAddresses(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Addresses retrieved", addresses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        AddressResponse address = addressService.getAddressById(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Address retrieved", address));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @Valid @RequestBody AddressRequest request,
            @AuthenticationPrincipal User currentUser) {
        AddressResponse address = addressService.createAddress(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address created", address));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request,
            @AuthenticationPrincipal User currentUser) {
        AddressResponse address = addressService.updateAddress(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated", address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        addressService.deleteAddress(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }
}
