package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.*;
import com.helvinotech.hms.entity.*;
import com.helvinotech.hms.enums.PaymentStatus;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillingRepository billingRepository;
    private final BillingItemRepository billingItemRepository;
    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;
    private final UserRepository userRepository;
    private static final AtomicLong invoiceCounter = new AtomicLong(0);

    @Transactional
    public BillingDTO createBilling(BillingDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", dto.getPatientId()));
        Billing billing = Billing.builder()
                .invoiceNumber(generateInvoiceNumber())
                .patient(patient)
                .build();
        if (dto.getVisitId() != null) {
            Visit visit = visitRepository.findById(dto.getVisitId())
                    .orElseThrow(() -> new ResourceNotFoundException("Visit", dto.getVisitId()));
            billing.setVisit(visit);
        }
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    public BillingDTO getBilling(Long id) {
        return mapToDto(billingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Billing", id)));
    }

    public Page<BillingDTO> getBillingsByPatient(Long patientId, Pageable pageable) {
        return billingRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable).map(this::mapToDto);
    }

    public Page<BillingDTO> getBillingsByStatus(PaymentStatus status, Pageable pageable) {
        return billingRepository.findByStatus(status, pageable).map(this::mapToDto);
    }

    public Page<BillingDTO> getAllBillings(Pageable pageable) {
        return billingRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional
    public BillingDTO addItem(Long billingId, BillingItemDTO itemDto) {
        Billing billing = billingRepository.findById(billingId)
                .orElseThrow(() -> new ResourceNotFoundException("Billing", billingId));
        BillingItem item = BillingItem.builder()
                .billing(billing)
                .serviceType(itemDto.getServiceType())
                .description(itemDto.getDescription())
                .quantity(itemDto.getQuantity())
                .unitPrice(itemDto.getUnitPrice())
                .totalPrice(itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity())))
                .build();
        billing.getItems().add(item);
        recalculateTotal(billing);
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    @Transactional
    public BillingDTO processPayment(PaymentDTO paymentDto) {
        Billing billing = billingRepository.findById(paymentDto.getBillingId())
                .orElseThrow(() -> new ResourceNotFoundException("Billing", paymentDto.getBillingId()));
        String receiptNo = "RCP-" + Year.now().getValue() + "-" + String.format("%06d", billingRepository.count());
        Payment payment = Payment.builder()
                .billing(billing)
                .amount(paymentDto.getAmount())
                .paymentMethod(paymentDto.getPaymentMethod())
                .referenceNumber(paymentDto.getReferenceNumber())
                .receiptNumber(receiptNo)
                .build();
        if (paymentDto.getReceivedByName() != null) {
            // receiver handled by controller setting user
        }
        billing.getPayments().add(payment);
        billing.setPaidAmount(billing.getPaidAmount().add(paymentDto.getAmount()));
        if (billing.getPaidAmount().compareTo(billing.getTotalAmount()) >= 0) {
            billing.setStatus(PaymentStatus.PAID);
        } else if (billing.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            billing.setStatus(PaymentStatus.PARTIAL);
        }
        billing = billingRepository.save(billing);
        return mapToDto(billing);
    }

    public BigDecimal getRevenueToday() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return billingRepository.sumRevenueByDateRange(startOfDay, startOfDay.plusDays(1));
    }

    public BigDecimal getRevenueThisMonth() {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
        return billingRepository.sumRevenueByDateRange(startOfMonth, LocalDateTime.now());
    }

    private void recalculateTotal(Billing billing) {
        BigDecimal total = billing.getItems().stream()
                .map(BillingItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        billing.setTotalAmount(total);
    }

    private String generateInvoiceNumber() {
        long count = billingRepository.count() + 1 + invoiceCounter.incrementAndGet();
        return "INV-" + Year.now().getValue() + "-" + String.format("%06d", count);
    }

    private BillingDTO mapToDto(Billing b) {
        BillingDTO dto = new BillingDTO();
        dto.setId(b.getId());
        dto.setInvoiceNumber(b.getInvoiceNumber());
        dto.setPatientId(b.getPatient().getId());
        dto.setPatientName(b.getPatient().getFullName());
        dto.setPatientNo(b.getPatient().getPatientNo());
        if (b.getVisit() != null) dto.setVisitId(b.getVisit().getId());
        dto.setTotalAmount(b.getTotalAmount());
        dto.setPaidAmount(b.getPaidAmount());
        dto.setInsuranceCoveredAmount(b.getInsuranceCoveredAmount());
        dto.setStatus(b.getStatus());
        dto.setItems(b.getItems().stream().map(this::mapItemToDto).collect(Collectors.toList()));
        dto.setPayments(b.getPayments().stream().map(this::mapPaymentToDto).collect(Collectors.toList()));
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }

    private BillingItemDTO mapItemToDto(BillingItem i) {
        BillingItemDTO dto = new BillingItemDTO();
        dto.setId(i.getId());
        dto.setBillingId(i.getBilling().getId());
        dto.setServiceType(i.getServiceType());
        dto.setDescription(i.getDescription());
        dto.setQuantity(i.getQuantity());
        dto.setUnitPrice(i.getUnitPrice());
        dto.setTotalPrice(i.getTotalPrice());
        return dto;
    }

    private PaymentDTO mapPaymentToDto(Payment p) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(p.getId());
        dto.setBillingId(p.getBilling().getId());
        dto.setAmount(p.getAmount());
        dto.setPaymentMethod(p.getPaymentMethod());
        dto.setReferenceNumber(p.getReferenceNumber());
        dto.setReceiptNumber(p.getReceiptNumber());
        if (p.getReceivedBy() != null) dto.setReceivedByName(p.getReceivedBy().getFullName());
        dto.setCreatedAt(p.getCreatedAt());
        return dto;
    }
}
