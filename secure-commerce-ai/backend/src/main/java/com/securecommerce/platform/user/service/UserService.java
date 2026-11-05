package com.securecommerce.platform.user.service;

import com.securecommerce.platform.user.dto.ChangePasswordRequest;
import com.securecommerce.platform.user.dto.UpdateProfileRequest;
import com.securecommerce.platform.user.dto.UserResponse;
import com.securecommerce.platform.user.entity.User;
import com.securecommerce.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * UserService — Core business logic for user profile management and account security.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Retrieve user profile by user ID.
     */
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = findUserById(userId);
        return UserResponse.from(user);
    }

    /**
     * Update user profile fields (firstName, lastName).
     */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUserById(userId);

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());

        User savedUser = userRepository.save(user);
        log.info("Profile updated successfully for user ID: {}", userId);

        return UserResponse.from(savedUser);
    }

    /**
     * Change user password securely with BCrypt verification.
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        // 1. Verify confirmation match
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New passwords do not match");
        }

        User user = findUserById(userId);

        // 2. Verify current password matches stored BCrypt hash
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        // 3. Ensure new password is not identical to the current one
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password cannot be the same as your current password");
        }

        // 4. Hash and save new password
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        log.info("Password changed successfully for user ID: {}", userId);
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
