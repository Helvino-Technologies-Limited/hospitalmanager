package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.PatientDTO;
import com.helvinotech.hms.entity.InsuranceCompany;
import com.helvinotech.hms.entity.Patient;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.InsuranceCompanyRepository;
import com.helvinotech.hms.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatientService {

    private final PatientRepository patientRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private static final AtomicLong counter = new AtomicLong(0);

    @Transactional
    public PatientDTO createPatient(PatientDTO dto) {
        Patient patient = new Patient();
        patient.setPatientNo(generatePatientNo());
        mapDtoToEntity(dto, patient);
        patient = patientRepository.save(patient);
        return mapEntityToDto(patient);
    }

    public PatientDTO getPatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        return mapEntityToDto(patient);
    }

    public PatientDTO getPatientByNo(String patientNo) {
        Patient patient = patientRepository.findByPatientNo(patientNo)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientNo));
        return mapEntityToDto(patient);
    }

    public Page<PatientDTO> getAllPatients(Pageable pageable) {
        return patientRepository.findAll(pageable).map(this::mapEntityToDto);
    }

    public Page<PatientDTO> searchPatients(String query, Pageable pageable) {
        return patientRepository.searchPatients(query, pageable).map(this::mapEntityToDto);
    }

    @Transactional
    public PatientDTO updatePatient(Long id, PatientDTO dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
        mapDtoToEntity(dto, patient);
        patient = patientRepository.save(patient);
        return mapEntityToDto(patient);
    }

    public long countPatientsToday() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return patientRepository.countByCreatedAtBetween(startOfDay, endOfDay);
    }

    private String generatePatientNo() {
        long count = patientRepository.count() + 1 + counter.incrementAndGet();
        return "PT-" + Year.now().getValue() + "-" + String.format("%06d", count);
    }

    private void mapDtoToEntity(PatientDTO dto, Patient patient) {
        patient.setFullName(dto.getFullName());
        patient.setGender(dto.getGender());
        patient.setDateOfBirth(dto.getDateOfBirth());
        patient.setPhone(dto.getPhone());
        patient.setEmail(dto.getEmail());
        patient.setIdNumber(dto.getIdNumber());
        patient.setAddress(dto.getAddress());
        patient.setNextOfKinName(dto.getNextOfKinName());
        patient.setNextOfKinPhone(dto.getNextOfKinPhone());
        patient.setNextOfKinRelationship(dto.getNextOfKinRelationship());
        patient.setAllergies(dto.getAllergies());
        patient.setBloodGroup(dto.getBloodGroup());
        patient.setInsuranceMemberNumber(dto.getInsuranceMemberNumber());

        if (dto.getInsuranceCompanyId() != null) {
            InsuranceCompany ic = insuranceCompanyRepository.findById(dto.getInsuranceCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Insurance Company", dto.getInsuranceCompanyId()));
            patient.setInsuranceCompany(ic);
        }
    }

    public PatientDTO mapEntityToDto(Patient p) {
        PatientDTO dto = new PatientDTO();
        dto.setId(p.getId());
        dto.setPatientNo(p.getPatientNo());
        dto.setFullName(p.getFullName());
        dto.setGender(p.getGender());
        dto.setDateOfBirth(p.getDateOfBirth());
        dto.setPhone(p.getPhone());
        dto.setEmail(p.getEmail());
        dto.setIdNumber(p.getIdNumber());
        dto.setAddress(p.getAddress());
        dto.setNextOfKinName(p.getNextOfKinName());
        dto.setNextOfKinPhone(p.getNextOfKinPhone());
        dto.setNextOfKinRelationship(p.getNextOfKinRelationship());
        dto.setAllergies(p.getAllergies());
        dto.setBloodGroup(p.getBloodGroup());
        dto.setInsuranceMemberNumber(p.getInsuranceMemberNumber());
        if (p.getInsuranceCompany() != null) {
            dto.setInsuranceCompanyId(p.getInsuranceCompany().getId());
            dto.setInsuranceCompanyName(p.getInsuranceCompany().getName());
        }
        return dto;
    }
}
