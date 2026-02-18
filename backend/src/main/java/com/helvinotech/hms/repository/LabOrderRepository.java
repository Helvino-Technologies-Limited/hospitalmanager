package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.LabOrder;
import com.helvinotech.hms.enums.LabOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {
    List<LabOrder> findByVisitId(Long visitId);
    Page<LabOrder> findByStatus(LabOrderStatus status, Pageable pageable);
    long countByStatus(LabOrderStatus status);
}
