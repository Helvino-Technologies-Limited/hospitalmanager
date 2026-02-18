package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.*;
import com.helvinotech.hms.enums.PaymentStatus;
import com.helvinotech.hms.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BillingDTO>> create(@RequestBody BillingDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(billingService.createBilling(dto)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BillingDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBilling(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BillingDTO>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getAllBillings(pageable)));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<Page<BillingDTO>>> getByPatient(@PathVariable Long patientId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBillingsByPatient(patientId, pageable)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<Page<BillingDTO>>> getByStatus(@PathVariable PaymentStatus status, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getBillingsByStatus(status, pageable)));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ApiResponse<BillingDTO>> addItem(@PathVariable Long id, @Valid @RequestBody BillingItemDTO item) {
        return ResponseEntity.ok(ApiResponse.success(billingService.addItem(id, item)));
    }

    @PostMapping("/payments")
    public ResponseEntity<ApiResponse<BillingDTO>> processPayment(@Valid @RequestBody PaymentDTO payment) {
        return ResponseEntity.ok(ApiResponse.success(billingService.processPayment(payment)));
    }
}
