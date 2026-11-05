package com.securecommerce.platform.address.service;

import com.securecommerce.platform.address.dto.AddressRequest;
import com.securecommerce.platform.address.dto.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> getMyAddresses(Long userId);

    AddressResponse getAddressById(Long userId, Long addressId);

    AddressResponse createAddress(Long userId, AddressRequest request);

    AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request);

    void deleteAddress(Long userId, Long addressId);
}
