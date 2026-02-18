package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.UserDTO;
import com.helvinotech.hms.enums.UserRole;
import com.helvinotech.hms.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> create(@Valid @RequestBody UserDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(userService.createUser(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUser(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getByRole(@PathVariable UserRole role) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUsersByRole(role)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> update(@PathVariable Long id, @Valid @RequestBody UserDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateUser(id, dto)));
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        userService.changePassword(id, body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated", null));
    }
}
