package com.securecommerce.platform.address.service;

import com.securecommerce.platform.address.dto.AddressRequest;
import com.securecommerce.platform.address.dto.AddressResponse;
import com.securecommerce.platform.address.entity.Address;
import com.securecommerce.platform.address.repository.AddressRepository;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(AddressResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddressById(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
        return AddressResponse.from(address);
    }

    @Override
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<Address> existing = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        boolean shouldBeDefault = request.isDefault() || existing.isEmpty();

        if (shouldBeDefault) {
            addressRepository.clearDefaultAddressesForUser(userId);
        }

        Address address = Address.builder()
                .user(user)
                .label(request.label())
                .fullName(request.fullName())
                .phone(request.phone())
                .line1(request.line1())
                .line2(request.line2())
                .city(request.city())
                .state(request.state())
                .postalCode(request.postalCode())
                .country(request.country() != null && !request.country().isBlank() ? request.country() : "India")
                .isDefault(shouldBeDefault)
                .build();

        Address saved = addressRepository.save(address);
        return AddressResponse.from(saved);
    }

    @Override
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));

        if (request.isDefault() && !address.isDefault()) {
            addressRepository.clearDefaultAddressesForUser(userId);
            address.setDefault(true);
        } else if (!request.isDefault() && address.isDefault()) {
            // Keep default if it's the only address
            address.setDefault(false);
        }

        address.setLabel(request.label());
        address.setFullName(request.fullName());
        address.setPhone(request.phone());
        address.setLine1(request.line1());
        address.setLine2(request.line2());
        address.setCity(request.city());
        address.setState(request.state());
        address.setPostalCode(request.postalCode());
        if (request.country() != null && !request.country().isBlank()) {
            address.setCountry(request.country());
        }

        Address saved = addressRepository.save(address);
        return AddressResponse.from(saved);
    }

    @Override
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));

        boolean wasDefault = address.isDefault();
        addressRepository.delete(address);

        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }
}
