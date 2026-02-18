package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.DrugDTO;
import com.helvinotech.hms.dto.PrescriptionDTO;
import com.helvinotech.hms.entity.Drug;
import com.helvinotech.hms.entity.Prescription;
import com.helvinotech.hms.entity.User;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.DrugRepository;
import com.helvinotech.hms.repository.PrescriptionRepository;
import com.helvinotech.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PharmacyService {

    private final DrugRepository drugRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    public DrugDTO createDrug(DrugDTO dto) {
        Drug drug = new Drug();
        mapDtoToEntity(dto, drug);
        drug.setActive(true);
        return mapDrugToDto(drugRepository.save(drug));
    }

    public DrugDTO getDrug(Long id) {
        return mapDrugToDto(drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drug", id)));
    }

    public Page<DrugDTO> getAllDrugs(Pageable pageable) {
        return drugRepository.findByActiveTrue(pageable).map(this::mapDrugToDto);
    }

    public Page<DrugDTO> searchDrugs(String query, Pageable pageable) {
        return drugRepository.searchDrugs(query, pageable).map(this::mapDrugToDto);
    }

    @Transactional
    public DrugDTO updateDrug(Long id, DrugDTO dto) {
        Drug drug = drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drug", id));
        mapDtoToEntity(dto, drug);
        return mapDrugToDto(drugRepository.save(drug));
    }

    @Transactional
    public PrescriptionDTO dispensePrescription(Long prescriptionId, Long pharmacistId) {
        Prescription rx = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", prescriptionId));
        if (rx.isDispensed()) throw new BadRequestException("Already dispensed");

        Drug drug = rx.getDrug();
        int qty = rx.getQuantityPrescribed() != null ? rx.getQuantityPrescribed() : 1;
        if (drug.getQuantityInStock() < qty) throw new BadRequestException("Insufficient stock for " + drug.getGenericName());

        drug.setQuantityInStock(drug.getQuantityInStock() - qty);
        drugRepository.save(drug);

        User pharmacist = userRepository.findById(pharmacistId)
                .orElseThrow(() -> new ResourceNotFoundException("User", pharmacistId));
        rx.setDispensed(true);
        rx.setQuantityDispensed(qty);
        rx.setDispensedBy(pharmacist);
        rx.setDispensedAt(LocalDateTime.now());
        return mapPrescriptionToDto(prescriptionRepository.save(rx));
    }

    public List<PrescriptionDTO> getPendingPrescriptions() {
        return prescriptionRepository.findByDispensedFalse()
                .stream().map(this::mapPrescriptionToDto).collect(Collectors.toList());
    }

    public List<PrescriptionDTO> getVisitPrescriptions(Long visitId) {
        return prescriptionRepository.findByVisitId(visitId)
                .stream().map(this::mapPrescriptionToDto).collect(Collectors.toList());
    }

    public List<DrugDTO> getLowStockDrugs() {
        return drugRepository.findByQuantityInStockLessThanEqual(10)
                .stream().map(this::mapDrugToDto).collect(Collectors.toList());
    }

    public List<DrugDTO> getExpiringDrugs() {
        return drugRepository.findByExpiryDateBefore(LocalDate.now().plusMonths(3))
                .stream().map(this::mapDrugToDto).collect(Collectors.toList());
    }

    private void mapDtoToEntity(DrugDTO dto, Drug drug) {
        drug.setGenericName(dto.getGenericName());
        drug.setBrandName(dto.getBrandName());
        drug.setCategory(dto.getCategory());
        drug.setFormulation(dto.getFormulation());
        drug.setStrength(dto.getStrength());
        drug.setQuantityInStock(dto.getQuantityInStock());
        drug.setReorderLevel(dto.getReorderLevel());
        drug.setBatchNumber(dto.getBatchNumber());
        drug.setExpiryDate(dto.getExpiryDate());
        drug.setSupplier(dto.getSupplier());
        drug.setCostPrice(dto.getCostPrice());
        drug.setSellingPrice(dto.getSellingPrice());
        drug.setControlled(dto.isControlled());
        drug.setActive(dto.isActive());
    }

    private DrugDTO mapDrugToDto(Drug d) {
        DrugDTO dto = new DrugDTO();
        dto.setId(d.getId());
        dto.setGenericName(d.getGenericName());
        dto.setBrandName(d.getBrandName());
        dto.setCategory(d.getCategory());
        dto.setFormulation(d.getFormulation());
        dto.setStrength(d.getStrength());
        dto.setQuantityInStock(d.getQuantityInStock());
        dto.setReorderLevel(d.getReorderLevel());
        dto.setBatchNumber(d.getBatchNumber());
        dto.setExpiryDate(d.getExpiryDate());
        dto.setSupplier(d.getSupplier());
        dto.setCostPrice(d.getCostPrice());
        dto.setSellingPrice(d.getSellingPrice());
        dto.setControlled(d.isControlled());
        dto.setActive(d.isActive());
        return dto;
    }

    private PrescriptionDTO mapPrescriptionToDto(Prescription p) {
        PrescriptionDTO dto = new PrescriptionDTO();
        dto.setId(p.getId());
        dto.setVisitId(p.getVisit().getId());
        dto.setDrugId(p.getDrug().getId());
        dto.setDrugName(p.getDrug().getGenericName());
        dto.setDosage(p.getDosage());
        dto.setFrequency(p.getFrequency());
        dto.setDuration(p.getDuration());
        dto.setQuantityPrescribed(p.getQuantityPrescribed());
        dto.setQuantityDispensed(p.getQuantityDispensed());
        dto.setInstructions(p.getInstructions());
        dto.setDispensed(p.isDispensed());
        if (p.getDispensedBy() != null) dto.setDispensedByName(p.getDispensedBy().getFullName());
        dto.setDispensedAt(p.getDispensedAt());
        dto.setCreatedAt(p.getCreatedAt());
        return dto;
    }
}
