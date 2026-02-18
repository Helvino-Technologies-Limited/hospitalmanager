package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.ImagingOrder;
import com.helvinotech.hms.enums.LabOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImagingOrderRepository extends JpaRepository<ImagingOrder, Long> {
    List<ImagingOrder> findByVisitId(Long visitId);
    Page<ImagingOrder> findByStatus(LabOrderStatus status, Pageable pageable);
}
