package com.helvinotech.hms.service;

import com.helvinotech.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BillingRepository billingRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;

    public Map<String, Object> getFinancialReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        BigDecimal revenue = billingRepository.sumRevenueByDateRange(start, end);
        BigDecimal payments = paymentRepository.sumPaymentsByDateRange(start, end);
        BigDecimal expenses = expenseRepository.sumExpensesByDateRange(startDate, endDate);

        Map<String, Object> report = new HashMap<>();
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("totalRevenue", revenue);
        report.put("totalPayments", payments);
        report.put("totalExpenses", expenses);
        report.put("netIncome", payments.subtract(expenses));
        return report;
    }

    public Map<String, Object> getPatientReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        Map<String, Object> report = new HashMap<>();
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("newPatients", patientRepository.countByCreatedAtBetween(start, end));
        report.put("totalVisits", visitRepository.countByCreatedAtBetween(start, end));
        return report;
    }
}
