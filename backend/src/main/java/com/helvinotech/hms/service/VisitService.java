package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.*;
import com.helvinotech.hms.entity.*;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VisitService {

    private final VisitRepository visitRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public VisitDTO createVisit(VisitDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", dto.getPatientId()));
        Visit visit = new Visit();
        visit.setPatient(patient);
        visit.setVisitType(dto.getVisitType());
        visit.setChiefComplaint(dto.getChiefComplaint());
        if (dto.getDoctorId() != null) {
            User doctor = userRepository.findById(dto.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", dto.getDoctorId()));
            visit.setDoctor(doctor);
        }
        visit = visitRepository.save(visit);
        return mapToDto(visit);
    }

    public VisitDTO getVisit(Long id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        return mapToDto(visit);
    }

    public Page<VisitDTO> getVisitsByPatient(Long patientId, Pageable pageable) {
        return visitRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable).map(this::mapToDto);
    }

    public List<VisitDTO> getDoctorQueue(Long doctorId) {
        return visitRepository.findByDoctorIdAndCompletedFalseOrderByCreatedAtAsc(doctorId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public VisitDTO updateVisit(Long id, VisitDTO dto) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        if (dto.getDoctorId() != null) {
            User doctor = userRepository.findById(dto.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor", dto.getDoctorId()));
            visit.setDoctor(doctor);
        }
        visit.setChiefComplaint(dto.getChiefComplaint());
        visit.setPresentingIllness(dto.getPresentingIllness());
        visit.setExamination(dto.getExamination());
        visit.setDiagnosis(dto.getDiagnosis());
        visit.setDiagnosisCode(dto.getDiagnosisCode());
        visit.setTreatmentPlan(dto.getTreatmentPlan());
        visit.setDoctorNotes(dto.getDoctorNotes());
        visit.setBloodPressure(dto.getBloodPressure());
        visit.setTemperature(dto.getTemperature());
        visit.setPulseRate(dto.getPulseRate());
        visit.setRespiratoryRate(dto.getRespiratoryRate());
        visit.setWeight(dto.getWeight());
        visit.setHeight(dto.getHeight());
        visit.setOxygenSaturation(dto.getOxygenSaturation());
        visit = visitRepository.save(visit);
        return mapToDto(visit);
    }

    @Transactional
    public VisitDTO completeVisit(Long id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        visit.setCompleted(true);
        visit = visitRepository.save(visit);
        return mapToDto(visit);
    }

    public long countVisitsToday() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return visitRepository.countByCreatedAtBetween(startOfDay, startOfDay.plusDays(1));
    }

    public Page<VisitDTO> getAllVisits(Pageable pageable) {
        return visitRepository.findAll(pageable).map(this::mapToDto);
    }

    private VisitDTO mapToDto(Visit v) {
        VisitDTO dto = new VisitDTO();
        dto.setId(v.getId());
        dto.setPatientId(v.getPatient().getId());
        dto.setPatientName(v.getPatient().getFullName());
        dto.setPatientNo(v.getPatient().getPatientNo());
        if (v.getDoctor() != null) {
            dto.setDoctorId(v.getDoctor().getId());
            dto.setDoctorName(v.getDoctor().getFullName());
        }
        dto.setVisitType(v.getVisitType());
        dto.setChiefComplaint(v.getChiefComplaint());
        dto.setPresentingIllness(v.getPresentingIllness());
        dto.setExamination(v.getExamination());
        dto.setDiagnosis(v.getDiagnosis());
        dto.setDiagnosisCode(v.getDiagnosisCode());
        dto.setTreatmentPlan(v.getTreatmentPlan());
        dto.setDoctorNotes(v.getDoctorNotes());
        dto.setBloodPressure(v.getBloodPressure());
        dto.setTemperature(v.getTemperature());
        dto.setPulseRate(v.getPulseRate());
        dto.setRespiratoryRate(v.getRespiratoryRate());
        dto.setWeight(v.getWeight());
        dto.setHeight(v.getHeight());
        dto.setOxygenSaturation(v.getOxygenSaturation());
        dto.setCompleted(v.isCompleted());
        dto.setCreatedAt(v.getCreatedAt());
        return dto;
    }
}
