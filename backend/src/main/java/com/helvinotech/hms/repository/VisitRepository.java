package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Visit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {
    Page<Visit> findByPatientIdOrderByCreatedAtDesc(Long patientId, Pageable pageable);
    List<Visit> findByDoctorIdAndCompletedFalseOrderByCreatedAtAsc(Long doctorId);
    Page<Visit> findByDoctorIdOrderByCreatedAtDesc(Long doctorId, Pageable pageable);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<Visit> findByCompletedFalseOrderByCreatedAtAsc();
}
