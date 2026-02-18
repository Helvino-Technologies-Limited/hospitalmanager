package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.BillingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillingItemRepository extends JpaRepository<BillingItem, Long> {
    List<BillingItem> findByBillingId(Long billingId);
}
