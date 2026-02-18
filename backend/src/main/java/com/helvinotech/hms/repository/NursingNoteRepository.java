package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.NursingNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NursingNoteRepository extends JpaRepository<NursingNote, Long> {
    List<NursingNote> findByAdmissionIdOrderByCreatedAtDesc(Long admissionId);
}
