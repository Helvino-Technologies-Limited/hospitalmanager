package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Admission;
import com.helvinotech.hms.enums.AdmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {
    Page<Admission> findByStatus(AdmissionStatus status, Pageable pageable);
    List<Admission> findByPatientId(Long patientId);
    long countByStatus(AdmissionStatus status);
}
