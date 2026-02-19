package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.UserDTO;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.enums.UserRole;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = false)
    public UserDTO createUser(UserDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email already in use: " + dto.getEmail());
        }
        User user = User.builder()
                .fullName(dto.getFullName())
                .email(dto.getEmail())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .phone(dto.getPhone())
                .role(dto.getRole())
                .department(dto.getDepartment())
                .specialization(dto.getSpecialization())
                .licenseNumber(dto.getLicenseNumber())
                .active(true)
                .build();
        return mapToDto(userRepository.save(user));
    }

    public UserDTO getUser(Long id) {
        return mapToDto(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id)));
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<UserDTO> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = false)
    public UserDTO updateUser(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setFullName(dto.getFullName());
        user.setPhone(dto.getPhone());
        user.setRole(dto.getRole());
        user.setDepartment(dto.getDepartment());
        user.setSpecialization(dto.getSpecialization());
        user.setLicenseNumber(dto.getLicenseNumber());
        user.setActive(dto.isActive());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }
        return mapToDto(userRepository.save(user));
    }

    @Transactional(readOnly = false)
    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional(readOnly = false)
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setActive(false);
        userRepository.save(user);
    }

    private UserDTO mapToDto(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setFullName(u.getFullName());
        dto.setEmail(u.getEmail());
        dto.setPhone(u.getPhone());
        dto.setRole(u.getRole());
        dto.setDepartment(u.getDepartment());
        dto.setSpecialization(u.getSpecialization());
        dto.setLicenseNumber(u.getLicenseNumber());
        dto.setActive(u.isActive());
        return dto;
    }
}
