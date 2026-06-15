package com.hms.search.controller;

import com.hms.search.document.PatientDocument;
import com.hms.search.repository.PatientSearchRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/search/patients")
@CrossOrigin(origins = "*")
public class SearchController {

    private final PatientSearchRepository searchRepository;

    public SearchController(PatientSearchRepository searchRepository) {
        this.searchRepository = searchRepository;
    }

    // Indexing endpoint (typically called from patient-service)
    @PostMapping
    public ResponseEntity<Void> indexPatient(
            @RequestHeader(value = "X-TenantID", required = false) String headerTenantId,
            @RequestBody Map<String, Object> payload) {
        
        try {
            Long patientId = ((Number) payload.get("id")).longValue();
            String name = (String) payload.get("name");
            String email = (String) payload.get("email");
            String phone = (String) payload.get("phone");
            String medicalRecordNumber = (String) payload.get("medicalRecordNumber");
            String diagnosis = (String) payload.get("diagnosis");
            
            // Determine tenant ID (favor request payload or headers)
            String tenantId = (String) payload.get("tenantId");
            if (tenantId == null) {
                tenantId = headerTenantId;
            }
            if (tenantId == null) {
                tenantId = "public";
            }

            PatientDocument document = new PatientDocument(
                tenantId + "_" + patientId, // Unique Elasticsearch ID
                patientId,
                name,
                email,
                phone,
                medicalRecordNumber,
                diagnosis,
                tenantId
            );

            searchRepository.save(document);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            System.err.println("Error indexing patient document: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Fuzzy search endpoint for users
    @GetMapping("/query")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<PatientDocument>> searchPatients(@RequestParam String name) {
        // Retrieve tenant ID resolved during JWT security filtering
        String tenantId = (String) SecurityContextHolder.getContext().getAuthentication().getDetails();
        if (tenantId == null) {
            tenantId = "public";
        }

        // Search patients in Elasticsearch filtered by the user's active tenant
        List<PatientDocument> results = searchRepository.findByNameContainingAndTenantId(name, tenantId);
        return ResponseEntity.ok(results);
    }
}
